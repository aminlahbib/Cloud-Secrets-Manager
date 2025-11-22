package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "secrets", indexes = {
    @Index(name = "idx_secret_key", columnList = "secretKey", unique = true),
    @Index(name = "idx_created_by", columnList = "createdBy")
})
@EntityListeners(AuditingEntityListener.class)
public class Secret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String secretKey;

    @Column(nullable = false, length = 5000)
    private String encryptedValue;

    @Column(nullable = false)
    private String createdBy;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    // Expiration management
    @Column(nullable = true)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean expired = false;

    public Secret() {
    }

    public Secret(Long id, String secretKey, String encryptedValue, String createdBy, 
                  LocalDateTime createdAt, LocalDateTime updatedAt, Long version, 
                  LocalDateTime expiresAt, Boolean expired) {
        this.id = id;
        this.secretKey = secretKey;
        this.encryptedValue = encryptedValue;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.version = version;
        this.expiresAt = expiresAt;
        this.expired = expired;
    }
    
    public boolean isExpired() {
        if (expiresAt == null) {
            return false; // No expiration set
        }
        return LocalDateTime.now().isAfter(expiresAt) || expired;
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

    public String getEncryptedValue() {
        return encryptedValue;
    }

    public void setEncryptedValue(String encryptedValue) {
        this.encryptedValue = encryptedValue;
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

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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

    public static SecretBuilder builder() {
        return new SecretBuilder();
    }

    public static class SecretBuilder {
        private Long id;
        private String secretKey;
        private String encryptedValue;
        private String createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long version;
        private LocalDateTime expiresAt;
        private Boolean expired = false;

        public SecretBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SecretBuilder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public SecretBuilder encryptedValue(String encryptedValue) {
            this.encryptedValue = encryptedValue;
            return this;
        }

        public SecretBuilder createdBy(String createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public SecretBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SecretBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public SecretBuilder version(Long version) {
            this.version = version;
            return this;
        }

        public SecretBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public SecretBuilder expired(Boolean expired) {
            this.expired = expired;
            return this;
        }

        public Secret build() {
            return new Secret(id, secretKey, encryptedValue, createdBy, createdAt, updatedAt, version, expiresAt, expired);
        }
    }
}
