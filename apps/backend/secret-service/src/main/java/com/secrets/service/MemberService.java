package com.secrets.service;

import com.secrets.dto.member.MemberRequest;
import com.secrets.dto.member.MemberResponse;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.dto.notification.NotificationType;
import com.secrets.entity.ProjectMembership;
import com.secrets.entity.User;
import com.secrets.entity.Workflow;
import com.secrets.entity.WorkflowProject;
import com.secrets.repository.ProjectMembershipRepository;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.UserRepository;
import com.secrets.repository.WorkflowProjectRepository;
import com.secrets.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing project memberships
 */
@Service
@Transactional
public class MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberService.class);
    
    private final ProjectMembershipRepository membershipRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectPermissionService permissionService;
    private final InvitationService invitationService;
    private final WorkflowRepository workflowRepository;
    private final WorkflowProjectRepository workflowProjectRepository;
    private final WorkflowService workflowService;
    private final NotificationEventPublisher notificationEventPublisher;

    public MemberService(ProjectMembershipRepository membershipRepository,
                        ProjectRepository projectRepository,
                        UserRepository userRepository,
                        ProjectPermissionService permissionService,
                        InvitationService invitationService,
                        WorkflowRepository workflowRepository,
                        WorkflowProjectRepository workflowProjectRepository,
                        WorkflowService workflowService,
                        NotificationEventPublisher notificationEventPublisher) {
        this.membershipRepository = membershipRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.permissionService = permissionService;
        this.invitationService = invitationService;
        this.workflowRepository = workflowRepository;
        this.workflowProjectRepository = workflowProjectRepository;
        this.workflowService = workflowService;
        this.notificationEventPublisher = notificationEventPublisher;
    }

    /**
     * List all members of a project
     */
    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID projectId, UUID userId) {
        // Check access
        if (!permissionService.canViewProject(projectId, userId)) {
            throw new SecurityException("Access denied");
        }

        List<ProjectMembership> memberships = membershipRepository.findByProjectId(projectId);
        return memberships.stream()
            .map(MemberResponse::from)
            .collect(Collectors.toList());
    }

    /**
     * Invite a member to a project (direct add or create invitation)
     */
    public Object inviteMember(UUID projectId, MemberRequest request, UUID userId) {
        // Check permission
        if (!permissionService.canInviteRole(projectId, userId, request.getRole())) {
            throw new SecurityException("You don't have permission to invite " + request.getRole() + " role");
        }

        // Verify project exists
        projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check if user exists
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        
        if (existingUser.isPresent()) {
            // Direct add - user exists
            User user = existingUser.get();
            
            // Check if already a member
            if (membershipRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
                throw new IllegalArgumentException("User is already a member of this project");
            }

            // Create membership
            ProjectMembership membership = new ProjectMembership();
            membership.setProjectId(projectId);
            membership.setUserId(user.getId());
            membership.setRole(request.getRole());
            membership.setInvitedBy(userId);

            ProjectMembership saved = membershipRepository.save(membership);
            
            // Add to their default workflow
            try {
                Workflow defaultWorkflow = workflowService.ensureDefaultWorkflow(user.getId());
                workflowService.addProjectToWorkflow(defaultWorkflow.getId(), projectId, user.getId());
            } catch (Exception e) {
                log.warn("Failed to add project to user's default workflow: {}", e.getMessage());
            }

            log.info("Added user {} to project {} as {}", request.getEmail(), projectId, request.getRole());
            return MemberResponse.from(saved);
        } else {
            // Create invitation - user doesn't exist yet
            return invitationService.createInvitation(projectId, request.getEmail(), request.getRole(), userId);
        }
    }

    /**
     * Update member role
     */
    public MemberResponse updateMemberRole(UUID projectId, UUID memberUserId, ProjectMembership.ProjectRole newRole, UUID userId) {
        // Check permission
        ProjectMembership existing = membershipRepository.findByProjectIdAndUserId(projectId, memberUserId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        // Can't change your own role
        if (memberUserId.equals(userId)) {
            throw new IllegalArgumentException("Cannot change your own role");
        }

        // Check if user can change this role
        if (!permissionService.canRemoveRole(projectId, userId, existing.getRole()) ||
            !permissionService.canInviteRole(projectId, userId, newRole)) {
            throw new SecurityException("You don't have permission to change this member's role");
        }

        existing.setRole(newRole);
        ProjectMembership saved = membershipRepository.save(existing);

        log.info("Updated role of user {} in project {} to {}", memberUserId, projectId, newRole);

        try {
            User member = userRepository.findById(memberUserId)
                .orElse(null);

            if (member != null) {
                NotificationEvent event = new NotificationEvent();
                event.setType(NotificationType.ROLE_CHANGED);
                event.setActorUserId(userId != null ? userId.toString() : null);
                event.setRecipientUserIds(List.of(memberUserId.toString()));
                event.setProjectId(projectId.toString());
                event.setTitle("Your role has changed");
                event.setMessage(String.format(
                    "Your role in this project has been updated to %s.",
                    newRole.name()));
                notificationEventPublisher.publish(event);
            }
        } catch (Exception e) {
            log.error("Failed to publish role change notification for user {} in project {}: {}",
                memberUserId, projectId, e.getMessage());
        }

        return MemberResponse.from(saved);
    }

    /**
     * Remove member from project
     */
    public void removeMember(UUID projectId, UUID memberUserId, UUID userId) {
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, memberUserId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        // Can't remove yourself
        if (memberUserId.equals(userId)) {
            throw new IllegalArgumentException("Use the leave endpoint to remove yourself");
        }

        // Check permission
        if (!permissionService.canRemoveRole(projectId, userId, membership.getRole())) {
            throw new SecurityException("You don't have permission to remove this member");
        }

        // Check if removing the last owner
        if (membership.getRole() == ProjectMembership.ProjectRole.OWNER) {
            Long ownerCount = membershipRepository.countOwnersByProjectId(projectId);
            if (ownerCount <= 1) {
                throw new IllegalStateException("Cannot remove the last owner");
            }
        }

        // Remove from all workflows owned by the member
        List<WorkflowProject> memberWorkflows = workflowProjectRepository.findByProjectId(projectId).stream()
            .filter(wp -> {
                Optional<Workflow> workflow = workflowRepository.findById(wp.getWorkflowId());
                return workflow.isPresent() && workflow.get().getUserId().equals(memberUserId);
            })
            .collect(Collectors.toList());
        workflowProjectRepository.deleteAll(memberWorkflows);

        membershipRepository.delete(membership);
        log.info("Removed user {} from project {}", memberUserId, projectId);
    }

    /**
     * Transfer ownership
     */
    public void transferOwnership(UUID projectId, UUID newOwnerUserId, UUID userId) {
        // Check current user is owner
        if (!permissionService.isOwner(projectId, userId)) {
            throw new SecurityException("Only owners can transfer ownership");
        }

        ProjectMembership currentOwner = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new IllegalStateException("Current user is not a member"));

        ProjectMembership newOwner = membershipRepository.findByProjectIdAndUserId(projectId, newOwnerUserId)
            .orElseThrow(() -> new IllegalArgumentException("Target user is not a member of this project"));

        // Transfer ownership
        currentOwner.setRole(ProjectMembership.ProjectRole.ADMIN);
        newOwner.setRole(ProjectMembership.ProjectRole.OWNER);

        membershipRepository.save(currentOwner);
        membershipRepository.save(newOwner);
        
        log.info("Transferred ownership of project {} from {} to {}", projectId, userId, newOwnerUserId);
    }
}

