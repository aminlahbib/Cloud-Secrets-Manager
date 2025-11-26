package com.secrets.service;

import com.secrets.dto.project.ProjectRequest;
import com.secrets.dto.project.ProjectResponse;
import com.secrets.entity.Project;
import com.secrets.entity.ProjectMembership;
import com.secrets.entity.Workflow;
import com.secrets.entity.WorkflowProject;
import com.secrets.repository.ProjectMembershipRepository;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.WorkflowProjectRepository;
import com.secrets.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing projects (collaboration units)
 */
@Service
@Transactional
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);
    
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository membershipRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowProjectRepository workflowProjectRepository;
    private final SecretRepository secretRepository;
    private final WorkflowService workflowService;

    public ProjectService(ProjectRepository projectRepository,
                         ProjectMembershipRepository membershipRepository,
                         WorkflowRepository workflowRepository,
                         WorkflowProjectRepository workflowProjectRepository,
                         SecretRepository secretRepository,
                         WorkflowService workflowService) {
        this.projectRepository = projectRepository;
        this.membershipRepository = membershipRepository;
        this.workflowRepository = workflowRepository;
        this.workflowProjectRepository = workflowProjectRepository;
        this.secretRepository = secretRepository;
        this.workflowService = workflowService;
    }

    /**
     * List accessible projects for a user
     */
    @Transactional(readOnly = true)
    public Page<ProjectResponse> listProjects(UUID userId, String search, boolean includeArchived, Pageable pageable) {
        Page<Project> projects;
        
        if (search != null && !search.trim().isEmpty()) {
            projects = projectRepository.findAccessibleProjectsByUserIdAndSearch(userId, search.trim(), pageable);
        } else {
            projects = projectRepository.findAccessibleProjectsByUserId(userId, pageable);
        }

        if (!includeArchived) {
            // Filter out archived projects
            projects = projects.filter(p -> !p.getIsArchived());
        }

        return projects.map(p -> toResponse(p, userId));
    }

    /**
     * Get project by ID (with permission check)
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check if user has access
        if (!membershipRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new SecurityException("Access denied to project");
        }

        return toResponse(project, userId);
    }

    /**
     * Create new project
     */
    public ProjectResponse createProject(ProjectRequest request, UUID userId) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setCreatedBy(userId);
        project.setIsArchived(false);

        Project saved = projectRepository.save(project);

        // Create membership as OWNER
        ProjectMembership membership = new ProjectMembership();
        membership.setProjectId(saved.getId());
        membership.setUserId(userId);
        membership.setRole(ProjectMembership.ProjectRole.OWNER);
        membershipRepository.save(membership);

        // Add to workflow if specified
        if (request.getWorkflowId() != null) {
            try {
                workflowService.addProjectToWorkflow(request.getWorkflowId(), saved.getId(), userId);
            } catch (Exception e) {
                log.warn("Failed to add project to workflow: {}", e.getMessage());
                // Don't fail project creation if workflow add fails
            }
        } else {
            // Add to default workflow
            Workflow defaultWorkflow = workflowService.ensureDefaultWorkflow(userId);
            workflowService.addProjectToWorkflow(defaultWorkflow.getId(), saved.getId(), userId);
        }

        log.info("Created project: {} by user: {}", saved.getName(), userId);
        return toResponse(saved, userId);
    }

    /**
     * Update project
     */
    public ProjectResponse updateProject(UUID projectId, ProjectRequest request, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check permission (ADMIN or OWNER)
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new SecurityException("Access denied"));
        
        if (membership.getRole() != ProjectMembership.ProjectRole.OWNER && 
            membership.getRole() != ProjectMembership.ProjectRole.ADMIN) {
            throw new SecurityException("Only admins and owners can update project");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());

        Project saved = projectRepository.save(project);
        return toResponse(saved, userId);
    }

    /**
     * Archive project (soft delete)
     */
    public void archiveProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check permission (OWNER only)
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new SecurityException("Access denied"));
        
        if (membership.getRole() != ProjectMembership.ProjectRole.OWNER) {
            throw new SecurityException("Only owners can archive project");
        }

        project.setIsArchived(true);
        project.setDeletedAt(LocalDateTime.now());
        project.setDeletedBy(userId);
        project.setScheduledPermanentDeleteAt(LocalDateTime.now().plusDays(30));

        projectRepository.save(project);
        log.info("Archived project: {} by user: {}", projectId, userId);
    }

    /**
     * Permanently delete project
     */
    public void deleteProjectPermanently(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check permission (OWNER only)
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new SecurityException("Access denied"));
        
        if (membership.getRole() != ProjectMembership.ProjectRole.OWNER) {
            throw new SecurityException("Only owners can delete project");
        }

        // Delete all workflow associations
        workflowProjectRepository.deleteAll(workflowProjectRepository.findByProjectId(projectId));
        
        // Delete project (cascades to memberships and secrets)
        projectRepository.delete(project);
        log.info("Permanently deleted project: {} by user: {}", projectId, userId);
    }

    /**
     * Restore archived project
     */
    public ProjectResponse restoreProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check permission (OWNER only)
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new SecurityException("Access denied"));
        
        if (membership.getRole() != ProjectMembership.ProjectRole.OWNER) {
            throw new SecurityException("Only owners can restore project");
        }

        project.setIsArchived(false);
        project.setDeletedAt(null);
        project.setDeletedBy(null);
        project.setScheduledPermanentDeleteAt(null);

        Project saved = projectRepository.save(project);
        return toResponse(saved, userId);
    }

    /**
     * Leave project
     */
    public void leaveProject(UUID projectId, UUID userId) {
        ProjectMembership membership = membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this project"));

        // Check if user is the only owner
        if (membership.getRole() == ProjectMembership.ProjectRole.OWNER) {
            Long ownerCount = membershipRepository.countOwnersByProjectId(projectId);
            if (ownerCount <= 1) {
                throw new IllegalStateException("Cannot leave project: you are the only owner. Transfer ownership or delete the project.");
            }
        }

        // Remove from all workflows
        workflowProjectRepository.deleteAll(workflowProjectRepository.findByProjectId(projectId));
        
        // Remove membership
        membershipRepository.delete(membership);
        log.info("User {} left project {}", userId, projectId);
    }

    private ProjectResponse toResponse(Project project, UUID userId) {
        ProjectResponse response = ProjectResponse.from(project);
        
        // Add computed fields
        response.setSecretCount(secretRepository.countByProjectId(project.getId()));
        response.setMemberCount(membershipRepository.countByProjectId(project.getId()));
        
        // Add current user's role
        membershipRepository.findByProjectIdAndUserId(project.getId(), userId)
            .ifPresent(m -> response.setCurrentUserRole(m.getRole()));
        
        return response;
    }
}

