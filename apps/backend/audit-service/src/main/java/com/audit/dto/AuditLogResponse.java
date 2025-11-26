package com.audit.dto;

import com.audit.entity.AuditLog;

import java.time.LocalDateTime;

public class AuditLogResponse {
    private Long id;
    private String username;
    private String action;
    private String secretKey;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String userAgent;

    public AuditLogResponse() {
    }

    public AuditLogResponse(Long id, String username, String action, String secretKey,
                            LocalDateTime timestamp, String ipAddress, String userAgent) {
        this.id = id;
        this.username = username;
        this.action = action;
        this.secretKey = secretKey;
        this.timestamp = timestamp;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public static AuditLogResponse from(AuditLog auditLog) {
        return AuditLogResponse.builder()
            .id(auditLog.getId())
            .username(auditLog.getUsername())
            .action(auditLog.getAction())
            .secretKey(auditLog.getSecretKey())
            .timestamp(auditLog.getTimestamp())
            .ipAddress(auditLog.getIpAddress())
            .userAgent(auditLog.getUserAgent())
            .build();
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
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

    public static final class Builder {
        private Long id;
        private String username;
        private String action;
        private String secretKey;
        private LocalDateTime timestamp;
        private String ipAddress;
        private String userAgent;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder action(String action) {
            this.action = action;
            return this;
        }

        public Builder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
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

        public AuditLogResponse build() {
            return new AuditLogResponse(id, username, action, secretKey, timestamp, ipAddress, userAgent);
        }
    }
}
