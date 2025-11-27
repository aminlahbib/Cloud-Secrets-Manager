package com.audit.dto;

import com.audit.entity.AuditLog;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public class AuditLogResponse {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private String action;
    private String resourceType;
    private String resourceId;
    private String resourceName;
    private Map<String, Object> oldValue;
    private Map<String, Object> newValue;
    private Map<String, Object> metadata;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    // Legacy fields for backward compatibility during migration
    private String username;
    private String secretKey;
    private LocalDateTime timestamp;

    public AuditLogResponse() {
    }

    public AuditLogResponse(UUID id, UUID projectId, UUID userId, String action, String resourceType,
                           String resourceId, String resourceName, Map<String, Object> oldValue,
                           Map<String, Object> newValue, Map<String, Object> metadata,
                           String ipAddress, String userAgent, LocalDateTime createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.userId = userId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.metadata = metadata;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    public static AuditLogResponse from(AuditLog auditLog) {
        AuditLogResponse response = AuditLogResponse.builder()
            .id(auditLog.getId())
            .projectId(auditLog.getProjectId())
            .userId(auditLog.getUserId())
            .action(auditLog.getAction())
            .resourceType(auditLog.getResourceType())
            .resourceId(auditLog.getResourceId())
            .resourceName(auditLog.getResourceName())
            .oldValue(auditLog.getOldValue())
            .newValue(auditLog.getNewValue())
            .metadata(auditLog.getMetadata())
            .ipAddress(auditLog.getIpAddress())
            .userAgent(auditLog.getUserAgent())
            .createdAt(auditLog.getCreatedAt())
            .build();

        // Set legacy fields for backward compatibility
        response.setTimestamp(auditLog.getCreatedAt());
        if ("SECRET".equals(auditLog.getResourceType())) {
            response.setSecretKey(auditLog.getResourceId());
        }

        return response;
    }

    public static Builder builder() {
        return new Builder();
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Legacy getters/setters for backward compatibility
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public LocalDateTime getTimestamp() {
        return timestamp != null ? timestamp : createdAt;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public static final class Builder {
        private UUID id;
        private UUID projectId;
        private UUID userId;
        private String action;
        private String resourceType;
        private String resourceId;
        private String resourceName;
        private Map<String, Object> oldValue;
        private Map<String, Object> newValue;
        private Map<String, Object> metadata;
        private String ipAddress;
        private String userAgent;
        private LocalDateTime createdAt;

        private Builder() {
        }

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder projectId(UUID projectId) {
            this.projectId = projectId;
            return this;
        }

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public Builder action(String action) {
            this.action = action;
            return this;
        }

        public Builder resourceType(String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        public Builder resourceId(String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        public Builder resourceName(String resourceName) {
            this.resourceName = resourceName;
            return this;
        }

        public Builder oldValue(Map<String, Object> oldValue) {
            this.oldValue = oldValue;
            return this;
        }

        public Builder newValue(Map<String, Object> newValue) {
            this.newValue = newValue;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AuditLogResponse build() {
            return new AuditLogResponse(id, projectId, userId, action, resourceType, resourceId,
                    resourceName, oldValue, newValue, metadata, ipAddress, userAgent, createdAt);
        }
    }
}
