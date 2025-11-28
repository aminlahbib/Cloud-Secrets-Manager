package com.secrets.dto;

import com.secrets.entity.SecretVersion;

import java.time.LocalDateTime;

public class SecretVersionDetailResponse {

    private Integer versionNumber;
    private String secretKey;
    private String changedBy;
    private String changeDescription;
    private LocalDateTime createdAt;
    private String value;

    public SecretVersionDetailResponse() {
    }

    public SecretVersionDetailResponse(Integer versionNumber,
            String secretKey,
            String changedBy,
            String changeDescription,
            LocalDateTime createdAt,
            String value) {
        this.versionNumber = versionNumber;
        this.secretKey = secretKey;
        this.changedBy = changedBy;
        this.changeDescription = changeDescription;
        this.createdAt = createdAt;
        this.value = value;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
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

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public static SecretVersionDetailResponse from(SecretVersion version, String decryptedValue) {
        return new SecretVersionDetailResponse(
                version.getVersionNumber(),
                version.getSecret() != null ? version.getSecret().getSecretKey() : null,
                version.getCreatedBy() != null ? version.getCreatedBy().toString() : "Unknown",
                version.getChangeNote() != null ? version.getChangeNote() : "",
                version.getCreatedAt(),
                decryptedValue);
    }
}
