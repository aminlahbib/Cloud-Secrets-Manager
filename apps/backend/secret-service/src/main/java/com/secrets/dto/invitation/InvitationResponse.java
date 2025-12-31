package com.secrets.dto.invitation;

import com.secrets.entity.ProjectInvitation;
import com.secrets.entity.ProjectMembership;
import java.time.LocalDateTime;
import java.util.UUID;

public class InvitationResponse {
    private UUID id;
    private UUID projectId;
    private ProjectSummary project;
    private String email;
    private ProjectMembership.ProjectRole role;
    private ProjectInvitation.InvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime acceptedAt;
    private UserInfo inviter;

    public InvitationResponse() {
    }

    public static InvitationResponse from(ProjectInvitation invitation) {
        InvitationResponse response = new InvitationResponse();
        response.setId(invitation.getId());
        response.setProjectId(invitation.getProjectId());
        response.setEmail(invitation.getEmail());
        response.setRole(invitation.getRole());
        response.setStatus(invitation.getStatus());
        response.setCreatedAt(invitation.getCreatedAt());
        response.setExpiresAt(invitation.getExpiresAt());
        response.setAcceptedAt(invitation.getAcceptedAt());
        
        if (invitation.getProject() != null) {
            ProjectSummary project = new ProjectSummary();
            project.setId(invitation.getProject().getId());
            project.setName(invitation.getProject().getName());
            response.setProject(project);
        }
        
        if (invitation.getInviter() != null) {
            UserInfo inviter = new UserInfo();
            inviter.setId(invitation.getInviter().getId());
            inviter.setEmail(invitation.getInviter().getEmail());
            inviter.setDisplayName(invitation.getInviter().getDisplayName());
            response.setInviter(inviter);
        }
        
        return response;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public ProjectSummary getProject() {
        return project;
    }

    public void setProject(ProjectSummary project) {
        this.project = project;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ProjectMembership.ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectMembership.ProjectRole role) {
        this.role = role;
    }

    public ProjectInvitation.InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(ProjectInvitation.InvitationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public UserInfo getInviter() {
        return inviter;
    }

    public void setInviter(UserInfo inviter) {
        this.inviter = inviter;
    }

    public static class ProjectSummary {
        private UUID id;
        private String name;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class UserInfo {
        private UUID id;
        private String email;
        private String displayName;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }
    }
}

