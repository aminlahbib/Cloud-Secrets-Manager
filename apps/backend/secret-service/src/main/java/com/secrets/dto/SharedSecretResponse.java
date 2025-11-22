package com.secrets.dto;

import com.secrets.entity.SharedSecret;

import java.time.LocalDateTime;

public class SharedSecretResponse {
    private Long id;
    private String secretKey;
    private String sharedWith;
    private String sharedBy;
    private String permission;
    private LocalDateTime sharedAt;

    public SharedSecretResponse() {
    }

    public SharedSecretResponse(Long id, String secretKey, String sharedWith, String sharedBy, 
                               String permission, LocalDateTime sharedAt) {
        this.id = id;
        this.secretKey = secretKey;
        this.sharedWith = sharedWith;
        this.sharedBy = sharedBy;
        this.permission = permission;
        this.sharedAt = sharedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getSharedWith() {
        return sharedWith;
    }

    public void setSharedWith(String sharedWith) {
        this.sharedWith = sharedWith;
    }

    public String getSharedBy() {
        return sharedBy;
    }

    public void setSharedBy(String sharedBy) {
        this.sharedBy = sharedBy;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }

    public static SharedSecretResponseBuilder builder() {
        return new SharedSecretResponseBuilder();
    }

    public static SharedSecretResponse from(SharedSecret sharedSecret) {
        return SharedSecretResponse.builder()
            .id(sharedSecret.getId())
            .secretKey(sharedSecret.getSecretKey())
            .sharedWith(sharedSecret.getSharedWith())
            .sharedBy(sharedSecret.getSharedBy())
            .permission(sharedSecret.getPermission())
            .sharedAt(sharedSecret.getSharedAt())
            .build();
    }

    public static class SharedSecretResponseBuilder {
        private Long id;
        private String secretKey;
        private String sharedWith;
        private String sharedBy;
        private String permission;
        private LocalDateTime sharedAt;

        public SharedSecretResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SharedSecretResponseBuilder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public SharedSecretResponseBuilder sharedWith(String sharedWith) {
            this.sharedWith = sharedWith;
            return this;
        }

        public SharedSecretResponseBuilder sharedBy(String sharedBy) {
            this.sharedBy = sharedBy;
            return this;
        }

        public SharedSecretResponseBuilder permission(String permission) {
            this.permission = permission;
            return this;
        }

        public SharedSecretResponseBuilder sharedAt(LocalDateTime sharedAt) {
            this.sharedAt = sharedAt;
            return this;
        }

        public SharedSecretResponse build() {
            return new SharedSecretResponse(id, secretKey, sharedWith, sharedBy, permission, sharedAt);
        }
    }
}
