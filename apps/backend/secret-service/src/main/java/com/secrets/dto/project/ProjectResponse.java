package com.secrets.dto.project;

import com.secrets.entity.Project;
import com.secrets.entity.ProjectMembership;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isArchived;
    private LocalDateTime deletedAt;
    private UUID deletedBy;
    private LocalDateTime scheduledPermanentDeleteAt;
    
    // Computed fields
    private Long secretCount;
    private Long memberCount;
    private ProjectMembership.ProjectRole currentUserRole;

    public ProjectResponse() {
    }

    public static ProjectResponse from(Project project) {
        ProjectResponse response = new ProjectResponse();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setCreatedBy(project.getCreatedBy());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());
        response.setIsArchived(project.getIsArchived());
        response.setDeletedAt(project.getDeletedAt());
        response.setDeletedBy(project.getDeletedBy());
        response.setScheduledPermanentDeleteAt(project.getScheduledPermanentDeleteAt());
        return response;
    }

    // Getters and Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public UUID getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(UUID deletedBy) {
        this.deletedBy = deletedBy;
    }

    public LocalDateTime getScheduledPermanentDeleteAt() {
        return scheduledPermanentDeleteAt;
    }

    public void setScheduledPermanentDeleteAt(LocalDateTime scheduledPermanentDeleteAt) {
        this.scheduledPermanentDeleteAt = scheduledPermanentDeleteAt;
    }

    public Long getSecretCount() {
        return secretCount;
    }

    public void setSecretCount(Long secretCount) {
        this.secretCount = secretCount;
    }

    public Long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Long memberCount) {
        this.memberCount = memberCount;
    }

    public ProjectMembership.ProjectRole getCurrentUserRole() {
        return currentUserRole;
    }

    public void setCurrentUserRole(ProjectMembership.ProjectRole currentUserRole) {
        this.currentUserRole = currentUserRole;
    }
}

