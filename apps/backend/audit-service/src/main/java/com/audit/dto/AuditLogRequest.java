package com.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public class AuditLogRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    private UUID projectId;

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Resource type is required")
    private String resourceType;

    private String resourceId;

    private String resourceName;

    private Map<String, Object> oldValue;

    private Map<String, Object> newValue;

    private Map<String, Object> metadata;

    public AuditLogRequest() {
    }

    public AuditLogRequest(UUID userId, UUID projectId, String action, String resourceType,
                          String resourceId, String resourceName, Map<String, Object> oldValue,
                          Map<String, Object> newValue, Map<String, Object> metadata) {
        this.userId = userId;
        this.projectId = projectId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.metadata = metadata;
    }

    // Getters and Setters
    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Map<String, Object> getOldValue() {
        return oldValue;
    }

    public void setOldValue(Map<String, Object> oldValue) {
        this.oldValue = oldValue;
    }

    public Map<String, Object> getNewValue() {
        return newValue;
    }

    public void setNewValue(Map<String, Object> newValue) {
        this.newValue = newValue;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
