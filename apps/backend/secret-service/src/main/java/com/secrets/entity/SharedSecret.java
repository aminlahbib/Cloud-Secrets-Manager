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
@Table(name = "shared_secrets", indexes = {
    @Index(name = "idx_secret_key", columnList = "secretKey"),
    @Index(name = "idx_shared_with", columnList = "sharedWith"),
    @Index(name = "idx_secret_shared_with", columnList = "secretKey,sharedWith", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}

