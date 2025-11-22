package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "secret_versions", indexes = {
    @Index(name = "idx_secret_key_version", columnList = "secretKey,versionNumber", unique = true),
    @Index(name = "idx_secret_key", columnList = "secretKey"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
@EntityListeners(AuditingEntityListener.class)
public class SecretVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String secretKey;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, length = 5000)
    private String encryptedValue;

    @Column(nullable = false)
    private String changedBy;

    @Column(length = 1000)
    private String changeDescription; // Optional description of the change

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Reference to the secret (for easier querying)
    // Made optional to avoid circular dependency issues during creation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secret_id")
    private Secret secret;

    public SecretVersion() {
    }

    public SecretVersion(Long id, String secretKey, Integer versionNumber, String encryptedValue,
                        String changedBy, String changeDescription, LocalDateTime createdAt, Secret secret) {
        this.id = id;
        this.secretKey = secretKey;
        this.versionNumber = versionNumber;
        this.encryptedValue = encryptedValue;
        this.changedBy = changedBy;
        this.changeDescription = changeDescription;
        this.createdAt = createdAt;
        this.secret = secret;
    }

    // Getters and Setters
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

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getEncryptedValue() {
        return encryptedValue;
    }

    public void setEncryptedValue(String encryptedValue) {
        this.encryptedValue = encryptedValue;
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

    public Secret getSecret() {
        return secret;
    }

    public void setSecret(Secret secret) {
        this.secret = secret;
    }

    public static SecretVersionBuilder builder() {
        return new SecretVersionBuilder();
    }

    public static class SecretVersionBuilder {
        private Long id;
        private String secretKey;
        private Integer versionNumber;
        private String encryptedValue;
        private String changedBy;
        private String changeDescription;
        private LocalDateTime createdAt;
        private Secret secret;

        public SecretVersionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SecretVersionBuilder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public SecretVersionBuilder versionNumber(Integer versionNumber) {
            this.versionNumber = versionNumber;
            return this;
        }

        public SecretVersionBuilder encryptedValue(String encryptedValue) {
            this.encryptedValue = encryptedValue;
            return this;
        }

        public SecretVersionBuilder changedBy(String changedBy) {
            this.changedBy = changedBy;
            return this;
        }

        public SecretVersionBuilder changeDescription(String changeDescription) {
            this.changeDescription = changeDescription;
            return this;
        }

        public SecretVersionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SecretVersionBuilder secret(Secret secret) {
            this.secret = secret;
            return this;
        }

        public SecretVersion build() {
            return new SecretVersion(id, secretKey, versionNumber, encryptedValue, changedBy, changeDescription, createdAt, secret);
        }
    }
}
