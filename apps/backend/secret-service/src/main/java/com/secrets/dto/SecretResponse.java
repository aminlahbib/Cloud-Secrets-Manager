package com.secrets.dto;

import com.secrets.entity.Secret;

import java.time.LocalDateTime;

public class SecretResponse {
    private String key;
    private String value;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private Boolean expired;

    public SecretResponse() {
    }

    public SecretResponse(String key, String value, String createdBy, LocalDateTime createdAt, 
                         LocalDateTime updatedAt, LocalDateTime expiresAt, Boolean expired) {
        this.key = key;
        this.value = value;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.expiresAt = expiresAt;
        this.expired = expired;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
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

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getExpired() {
        return expired;
    }

    public void setExpired(Boolean expired) {
        this.expired = expired;
    }

    public static SecretResponseBuilder builder() {
        return new SecretResponseBuilder();
    }

    public static SecretResponse from(Secret secret, String decryptedValue) {
        return SecretResponse.builder()
            .key(secret.getSecretKey())
            .value(decryptedValue)
            .createdBy(secret.getCreatedBy())
            .createdAt(secret.getCreatedAt())
            .updatedAt(secret.getUpdatedAt())
            .expiresAt(secret.getExpiresAt())
            .expired(secret.getExpired())
            .build();
    }

    public static class SecretResponseBuilder {
        private String key;
        private String value;
        private String createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime expiresAt;
        private Boolean expired;

        public SecretResponseBuilder key(String key) {
            this.key = key;
            return this;
        }

        public SecretResponseBuilder value(String value) {
            this.value = value;
            return this;
        }

        public SecretResponseBuilder createdBy(String createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public SecretResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SecretResponseBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public SecretResponseBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public SecretResponseBuilder expired(Boolean expired) {
            this.expired = expired;
            return this;
        }

        public SecretResponse build() {
            return new SecretResponse(key, value, createdBy, createdAt, updatedAt, expiresAt, expired);
        }
    }
}
