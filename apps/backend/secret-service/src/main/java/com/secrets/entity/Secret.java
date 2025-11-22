package com.secrets.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Builder.Default
    private Boolean expired = false;
    
    public boolean isExpired() {
        if (expiresAt == null) {
            return false; // No expiration set
        }
        return LocalDateTime.now().isAfter(expiresAt) || expired;
    }
}

