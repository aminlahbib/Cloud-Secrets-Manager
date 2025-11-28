package com.secrets.service;

import com.secrets.entity.ProjectMembership;
import com.secrets.repository.ProjectMembershipRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for checking project-level permissions based on user roles.
 * Implements the v3 Resource-Scoped RBAC model.
 */
@Service
@Transactional(readOnly = true)
public class ProjectPermissionService {
    
    private final ProjectMembershipRepository membershipRepository;

    public ProjectPermissionService(ProjectMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    /**
     * Get user's role in a project
     */
    @Cacheable(cacheNames = "projectMemberships", key = "T(java.lang.String).format('%s:%s', #projectId, #userId)")
    public Optional<ProjectMembership.ProjectRole> getUserRole(UUID projectId, UUID userId) {
        return membershipRepository.findByProjectIdAndUserId(projectId, userId)
            .map(ProjectMembership::getRole);
    }

    /**
     * Check if user has a specific role or higher
     */
    public boolean hasRole(UUID projectId, UUID userId, ProjectMembership.ProjectRole requiredRole) {
        Optional<ProjectMembership.ProjectRole> userRole = getUserRole(projectId, userId);
        if (userRole.isEmpty()) {
            return false;
        }
        return hasRoleOrHigher(userRole.get(), requiredRole);
    }

    /**
     * Check if user role is equal to or higher than required role
     */
    private boolean hasRoleOrHigher(ProjectMembership.ProjectRole userRole, ProjectMembership.ProjectRole requiredRole) {
        int userLevel = getRoleLevel(userRole);
        int requiredLevel = getRoleLevel(requiredRole);
        return userLevel >= requiredLevel;
    }

    /**
     * Get numeric level for role comparison (higher = more permissions)
     */
    private int getRoleLevel(ProjectMembership.ProjectRole role) {
        return switch (role) {
            case OWNER -> 4;
            case ADMIN -> 3;
            case MEMBER -> 2;
            case VIEWER -> 1;
        };
    }

    /**
     * Check if user can view project
     */
    public boolean canViewProject(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.VIEWER);
    }

    /**
     * Check if user can create secrets in project
     */
    public boolean canCreateSecrets(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.MEMBER);
    }

    /**
     * Check if user can update secrets in project
     */
    public boolean canUpdateSecrets(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.MEMBER);
    }

    /**
     * Check if user can delete secrets in project
     */
    public boolean canDeleteSecrets(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can move/copy secrets out of project
     */
    public boolean canMoveSecrets(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can rotate secrets
     */
    public boolean canRotateSecrets(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can invite Viewers
     */
    public boolean canInviteViewers(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can invite Members
     */
    public boolean canInviteMembers(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can invite Admins
     */
    public boolean canInviteAdmins(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can invite Owners
     */
    public boolean canInviteOwners(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can remove Viewers
     */
    public boolean canRemoveViewers(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can remove Members
     */
    public boolean canRemoveMembers(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can remove Admins
     */
    public boolean canRemoveAdmins(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can remove Owners
     */
    public boolean canRemoveOwners(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can edit project settings
     */
    public boolean canEditProject(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.ADMIN);
    }

    /**
     * Check if user can archive project
     */
    public boolean canArchiveProject(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can delete project
     */
    public boolean canDeleteProject(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user can invite a specific role
     */
    public boolean canInviteRole(UUID projectId, UUID userId, ProjectMembership.ProjectRole roleToInvite) {
        return switch (roleToInvite) {
            case VIEWER, MEMBER -> canInviteMembers(projectId, userId);
            case ADMIN -> canInviteAdmins(projectId, userId);
            case OWNER -> canInviteOwners(projectId, userId);
        };
    }

    /**
     * Check if user can remove a member with a specific role
     */
    public boolean canRemoveRole(UUID projectId, UUID userId, ProjectMembership.ProjectRole roleToRemove) {
        return switch (roleToRemove) {
            case VIEWER, MEMBER -> canRemoveMembers(projectId, userId);
            case ADMIN -> canRemoveAdmins(projectId, userId);
            case OWNER -> canRemoveOwners(projectId, userId);
        };
    }

    /**
     * Check if user is owner of project
     */
    public boolean isOwner(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.OWNER);
    }

    /**
     * Check if user is admin or owner
     */
    public boolean isAdminOrOwner(UUID projectId, UUID userId) {
        Optional<ProjectMembership.ProjectRole> userRole = getUserRole(projectId, userId);
        if (userRole.isEmpty()) {
            return false;
        }
        ProjectMembership.ProjectRole role = userRole.get();
        return role == ProjectMembership.ProjectRole.ADMIN || role == ProjectMembership.ProjectRole.OWNER;
    }

    /**
     * Check if user is member or higher (can create/update secrets)
     */
    public boolean isMemberOrHigher(UUID projectId, UUID userId) {
        return hasRole(projectId, userId, ProjectMembership.ProjectRole.MEMBER);
    }
}

