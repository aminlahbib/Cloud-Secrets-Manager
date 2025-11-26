package com.secrets.dto;

import com.secrets.entity.SecretVersion;

import java.time.LocalDateTime;

public class SecretVersionResponse {
    private String id; // Changed to String to support UUID
    private String secretKey;
    private Integer versionNumber;
    private String changedBy;
    private String changeDescription;
    private LocalDateTime createdAt;

    public SecretVersionResponse() {
    }

    public SecretVersionResponse(String id, String secretKey, Integer versionNumber, String changedBy, 
                                String changeDescription, LocalDateTime createdAt) {
        this.id = id;
        this.secretKey = secretKey;
        this.versionNumber = versionNumber;
        this.changedBy = changedBy;
        this.changeDescription = changeDescription;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getChangeDescription() {
        return changeDescription;
    }

    public void setChangeDescription(String changeDescription) {
        this.changeDescription = changeDescription;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static SecretVersionResponseBuilder builder() {
        return new SecretVersionResponseBuilder();
    }

    public static SecretVersionResponse from(SecretVersion version) {
        return SecretVersionResponse.builder()
            .id(version.getId() != null ? version.getId().toString() : null)
            .secretKey(version.getSecret() != null ? version.getSecret().getSecretKey() : null)
            .versionNumber(version.getVersionNumber())
            .changedBy(version.getCreatedBy() != null ? version.getCreatedBy().toString() : version.getChangedBy())
            .changeDescription(version.getChangeNote() != null ? version.getChangeNote() : version.getChangeDescription())
            .createdAt(version.getCreatedAt())
            .build();
    }

    public static class SecretVersionResponseBuilder {
        private String id;
        private String secretKey;
        private Integer versionNumber;
        private String changedBy;
        private String changeDescription;
        private LocalDateTime createdAt;

        public SecretVersionResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public SecretVersionResponseBuilder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public SecretVersionResponseBuilder versionNumber(Integer versionNumber) {
            this.versionNumber = versionNumber;
            return this;
        }

        public SecretVersionResponseBuilder changedBy(String changedBy) {
            this.changedBy = changedBy;
            return this;
        }

        public SecretVersionResponseBuilder changeDescription(String changeDescription) {
            this.changeDescription = changeDescription;
            return this;
        }

        public SecretVersionResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SecretVersionResponse build() {
            return new SecretVersionResponse(id, secretKey, versionNumber, changedBy, changeDescription, createdAt);
        }
    }
}
