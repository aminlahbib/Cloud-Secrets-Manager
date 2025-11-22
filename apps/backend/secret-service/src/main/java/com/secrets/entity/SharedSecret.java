package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "shared_secrets", indexes = {
    @Index(name = "idx_secret_key", columnList = "secretKey"),
    @Index(name = "idx_shared_with", columnList = "sharedWith"),
    @Index(name = "idx_secret_shared_with", columnList = "secretKey,sharedWith", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
public class SharedSecret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String secretKey;

    @Column(nullable = false)
    private String sharedWith; // Username or email of the user the secret is shared with

    @Column(nullable = false)
    private String sharedBy; // Username of the user who shared the secret

    @Column(length = 1000)
    private String permission; // READ, WRITE, etc. - for future fine-grained access control

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime sharedAt;

    public SharedSecret() {
    }

    public SharedSecret(Long id, String secretKey, String sharedWith, String sharedBy, 
                       String permission, LocalDateTime sharedAt) {
        this.id = id;
        this.secretKey = secretKey;
        this.sharedWith = sharedWith;
        this.sharedBy = sharedBy;
        this.permission = permission;
        this.sharedAt = sharedAt;
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

    public static SharedSecretBuilder builder() {
        return new SharedSecretBuilder();
    }

    public static class SharedSecretBuilder {
        private Long id;
        private String secretKey;
        private String sharedWith;
        private String sharedBy;
        private String permission;
        private LocalDateTime sharedAt;

        public SharedSecretBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SharedSecretBuilder secretKey(String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        public SharedSecretBuilder sharedWith(String sharedWith) {
            this.sharedWith = sharedWith;
            return this;
        }

        public SharedSecretBuilder sharedBy(String sharedBy) {
            this.sharedBy = sharedBy;
            return this;
        }

        public SharedSecretBuilder permission(String permission) {
            this.permission = permission;
            return this;
        }

        public SharedSecretBuilder sharedAt(LocalDateTime sharedAt) {
            this.sharedAt = sharedAt;
            return this;
        }

        public SharedSecret build() {
            return new SharedSecret(id, secretKey, sharedWith, sharedBy, permission, sharedAt);
        }
    }
}
