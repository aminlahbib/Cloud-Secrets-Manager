package com.secrets.service;

import com.secrets.dto.invitation.InvitationResponse;
import com.secrets.entity.ProjectInvitation;
import com.secrets.entity.ProjectMembership;
import com.secrets.entity.User;
import com.secrets.entity.Workflow;
import com.secrets.repository.ProjectInvitationRepository;
import com.secrets.repository.ProjectMembershipRepository;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing project invitations
 */
@Service
@Transactional
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);

    private final ProjectInvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMembershipRepository membershipRepository;
    private final WorkflowService workflowService;
    private final EmailService emailService;

    public InvitationService(ProjectInvitationRepository invitationRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ProjectMembershipRepository membershipRepository,
            WorkflowService workflowService,
            EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.workflowService = workflowService;
        this.emailService = emailService;
    }

    /**
     * Create an invitation for a user who doesn't exist yet
     */
    public ProjectInvitation createInvitation(UUID projectId, String email,
            ProjectMembership.ProjectRole role, UUID invitedBy) {
        // Verify project exists
        projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User already exists. Use direct add instead.");
        }

        // Check if invitation already exists
        List<ProjectInvitation> existing = invitationRepository.findByEmailAndStatus(email,
                ProjectInvitation.InvitationStatus.PENDING);
        if (existing.stream().anyMatch(inv -> inv.getProjectId().equals(projectId) && inv.isValid())) {
            throw new IllegalArgumentException("Invitation already sent to this email");
        }

        // Generate unique token
        String token = UUID.randomUUID().toString();

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProjectId(projectId);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setInvitedBy(invitedBy);
        invitation.setToken(token);
        invitation.setStatus(ProjectInvitation.InvitationStatus.PENDING);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7 day expiration

        ProjectInvitation saved = invitationRepository.save(invitation);
        log.info("Created invitation for {} to project {} with role {}", email, projectId, role);

        // Send email notification
        try {
            var project = projectRepository.findById(projectId).orElse(null);
            var inviter = userRepository.findById(invitedBy).orElse(null);

            if (project != null && inviter != null) {
                emailService.sendInvitationEmail(
                        email,
                        token,
                        project.getName(),
                        inviter.getEmail());
            }
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", email, e.getMessage());
            // Don't fail the invitation creation if email fails
        }

        return saved;
    }

    /**
     * List pending invitations for a user (by email)
     */
    @Transactional(readOnly = true)
    public List<InvitationResponse> listPendingInvitations(String email) {
        List<ProjectInvitation> invitations = invitationRepository.findPendingInvitationsByEmail(email,
                LocalDateTime.now());
        return invitations.stream()
                .map(InvitationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * List pending invitations for a project
     */
    @Transactional(readOnly = true)
    public List<InvitationResponse> listProjectInvitations(UUID projectId) {
        List<ProjectInvitation> invitations = invitationRepository.findByProjectId(projectId).stream()
                .filter(inv -> inv.getStatus() == ProjectInvitation.InvitationStatus.PENDING)
                .collect(Collectors.toList());
        return invitations.stream()
                .map(InvitationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Accept an invitation
     */
    public void acceptInvitation(String token, UUID userId) {
        ProjectInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (!invitation.isValid()) {
            throw new IllegalStateException("Invitation is expired or already used");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify email matches
        if (!user.getEmail().equalsIgnoreCase(invitation.getEmail())) {
            throw new SecurityException("Invitation email does not match user email");
        }

        // Check if already a member
        if (membershipRepository.existsByProjectIdAndUserId(invitation.getProjectId(), userId)) {
            invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
            throw new IllegalStateException("Already a member of this project");
        }

        // Create membership
        ProjectMembership membership = new ProjectMembership();
        membership.setProjectId(invitation.getProjectId());
        membership.setUserId(userId);
        membership.setRole(invitation.getRole());
        membership.setInvitedBy(invitation.getInvitedBy());
        membershipRepository.save(membership);

        // Add to user's default workflow
        Workflow defaultWorkflow = workflowService.ensureDefaultWorkflow(userId);
        workflowService.addProjectToWorkflow(defaultWorkflow.getId(), invitation.getProjectId(), userId);

        // Mark invitation as accepted
        invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        log.info("User {} accepted invitation to project {}", userId, invitation.getProjectId());
    }

    /**
     * Decline an invitation
     */
    public void declineInvitation(String token) {
        ProjectInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != ProjectInvitation.InvitationStatus.PENDING) {
            throw new IllegalStateException("Invitation is not pending");
        }

        // Mark as revoked (we don't delete to keep audit trail)
        invitation.setStatus(ProjectInvitation.InvitationStatus.REVOKED);
        invitationRepository.save(invitation);
    }

    /**
     * Revoke an invitation (by project admin/owner)
     */
    public void revokeInvitation(UUID projectId, UUID invitationId, UUID userId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!invitation.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Invitation does not belong to this project");
        }

        // Check permission (admin or owner)
        // Note: This would need ProjectPermissionService check, but to avoid circular
        // dependency,
        // we'll check membership directly
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new SecurityException("Access denied"));

        if (membership.getRole() != ProjectMembership.ProjectRole.OWNER &&
                membership.getRole() != ProjectMembership.ProjectRole.ADMIN) {
            throw new SecurityException("Only admins and owners can revoke invitations");
        }

        invitation.setStatus(ProjectInvitation.InvitationStatus.REVOKED);
        invitationRepository.save(invitation);

        log.info("Revoked invitation {} for project {}", invitationId, projectId);
    }

    /**
     * Clean up expired invitations (called by scheduled task)
     */
    public void cleanupExpiredInvitations() {
        List<ProjectInvitation> expired = invitationRepository.findExpiredInvitations(LocalDateTime.now());
        for (ProjectInvitation invitation : expired) {
            if (invitation.getStatus() == ProjectInvitation.InvitationStatus.PENDING) {
                invitation.setStatus(ProjectInvitation.InvitationStatus.EXPIRED);
                invitationRepository.save(invitation);
            }
        }
        log.info("Cleaned up {} expired invitations", expired.size());
    }
}
