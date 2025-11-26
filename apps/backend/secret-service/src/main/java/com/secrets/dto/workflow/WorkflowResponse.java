package com.secrets.dto.workflow;

import com.secrets.entity.Workflow;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class WorkflowResponse {
    private UUID id;
    private UUID userId;
    private String name;
    private String description;
    private String icon;
    private String color;
    private Boolean isDefault;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkflowProjectResponse> projects;

    public WorkflowResponse() {
    }

    public static WorkflowResponse from(Workflow workflow) {
        WorkflowResponse response = new WorkflowResponse();
        response.setId(workflow.getId());
        response.setUserId(workflow.getUserId());
        response.setName(workflow.getName());
        response.setDescription(workflow.getDescription());
        response.setIcon(workflow.getIcon());
        response.setColor(workflow.getColor());
        response.setIsDefault(workflow.getIsDefault());
        response.setDisplayOrder(workflow.getDisplayOrder());
        response.setCreatedAt(workflow.getCreatedAt());
        response.setUpdatedAt(workflow.getUpdatedAt());
        return response;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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

    public List<WorkflowProjectResponse> getProjects() {
        return projects;
    }

    public void setProjects(List<WorkflowProjectResponse> projects) {
        this.projects = projects;
    }

    public static class WorkflowProjectResponse {
        private UUID id;
        private UUID projectId;
        private ProjectSummary project;
        private Integer displayOrder;
        private LocalDateTime addedAt;

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

        public Integer getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(Integer displayOrder) {
            this.displayOrder = displayOrder;
        }

        public LocalDateTime getAddedAt() {
            return addedAt;
        }

        public void setAddedAt(LocalDateTime addedAt) {
            this.addedAt = addedAt;
        }
    }

    public static class ProjectSummary {
        private UUID id;
        private String name;
        private String description;

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
    }
}

