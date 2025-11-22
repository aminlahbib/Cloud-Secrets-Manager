package com.secrets.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}

