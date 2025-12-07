package com.audit.dto;

import com.audit.entity.AuditLog;
import com.audit.service.DescriptionFormatter;

import java.time.ZoneId;
import java.time.ZonedDateTime;
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
    private ZonedDateTime createdAt;
    private String description;

    public AuditLogResponse() {
    }

    public AuditLogResponse(UUID id, UUID projectId, UUID userId, String action, String resourceType,
            String resourceId, String resourceName, Map<String, Object> oldValue,
            Map<String, Object> newValue, Map<String, Object> metadata,
            String ipAddress, String userAgent, ZonedDateTime createdAt, String description) {
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
        this.description = description;
    }

    public static AuditLogResponse from(AuditLog auditLog) {
        return from(auditLog, null);
    }

    public static AuditLogResponse from(AuditLog auditLog, DescriptionFormatter descriptionFormatter) {
        // Generate description if formatter is provided
        String description = null;
        if (descriptionFormatter != null) {
            // Extract user name from metadata if available, otherwise use userId
            String userName = null;
            if (auditLog.getMetadata() != null) {
                Object userNameObj = auditLog.getMetadata().get("userName");
                if (userNameObj != null) {
                    userName = userNameObj.toString();
                } else {
                    Object userEmailObj = auditLog.getMetadata().get("userEmail");
                    if (userEmailObj != null) {
                        userName = userEmailObj.toString();
                    }
                }
            }
            if (userName == null) {
                userName = auditLog.getUserId() != null ? auditLog.getUserId().toString() : "Unknown user";
            }

            // Extract project name from metadata if available
            String projectName = null;
            if (auditLog.getMetadata() != null) {
                Object projectNameObj = auditLog.getMetadata().get("projectName");
                if (projectNameObj != null) {
                    projectName = projectNameObj.toString();
                }
            }

            description = descriptionFormatter.formatDescription(
                    userName,
                    auditLog.getAction(),
                    auditLog.getResourceType(),
                    auditLog.getResourceName(),
                    projectName,
                    auditLog.getMetadata()
            );
        }

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
                .createdAt(auditLog.getCreatedAt() != null ? auditLog.getCreatedAt().atZone(ZoneId.of("UTC")) : null)
                .description(description)
                .build();

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

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
        private ZonedDateTime createdAt;
        private String description;

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

        public Builder createdAt(ZonedDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public AuditLogResponse build() {
            return new AuditLogResponse(id, projectId, userId, action, resourceType, resourceId,
                    resourceName, oldValue, newValue, metadata, ipAddress, userAgent, createdAt, description);
        }
    }
}
