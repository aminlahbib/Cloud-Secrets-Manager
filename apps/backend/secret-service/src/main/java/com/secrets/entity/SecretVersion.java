package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "secret_versions", indexes = {
    @Index(name = "idx_versions_secret", columnList = "secretId"),
    @Index(name = "idx_versions_number", columnList = "secretId,versionNumber")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_secret_versions", columnNames = {"secretId", "versionNumber"})
})
@EntityListeners(AuditingEntityListener.class)
public class SecretVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "secret_id", nullable = false)
    private UUID secretId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secret_id", insertable = false, updatable = false)
    private Secret secret;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "encrypted_value", nullable = false, columnDefinition = "TEXT")
    private String encryptedValue;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private User creator;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "change_note", columnDefinition = "TEXT")
    private String changeNote;

    public SecretVersion() {
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSecretId() {
        return secretId;
    }

    public void setSecretId(UUID secretId) {
        this.secretId = secretId;
    }

    public Secret getSecret() {
        return secret;
    }

    public void setSecret(Secret secret) {
        this.secret = secret;
        if (secret != null) {
            this.secretId = secret.getId();
        }
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

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public User getCreator() {
        return creator;
    }

    public void setCreator(User creator) {
        this.creator = creator;
        if (creator != null) {
            this.createdBy = creator.getId();
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getChangeNote() {
        return changeNote;
    }

    public void setChangeNote(String changeNote) {
        this.changeNote = changeNote;
    }

    // Legacy getters for backwards compatibility
    @Deprecated
    public String getChangedBy() {
        return createdBy != null ? createdBy.toString() : null;
    }

    @Deprecated
    public String getChangeDescription() {
        return changeNote;
    }
}
