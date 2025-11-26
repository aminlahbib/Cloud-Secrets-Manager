package com.secrets.repository;

import com.secrets.entity.Secret;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecretRepository extends JpaRepository<Secret, UUID> {
    
    // ============================================================================
    // Project-Scoped Queries (v3)
    // ============================================================================
    
    Optional<Secret> findByProjectIdAndSecretKey(UUID projectId, String secretKey);
    boolean existsByProjectIdAndSecretKey(UUID projectId, String secretKey);
    Page<Secret> findByProjectId(UUID projectId, Pageable pageable);
    
    @Query("SELECT s FROM Secret s WHERE s.projectId = :projectId " +
           "AND (LOWER(s.secretKey) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Secret> findByProjectIdAndKeyword(
        @Param("projectId") UUID projectId, 
        @Param("keyword") String keyword, 
        Pageable pageable
    );
    
    @Query("SELECT COUNT(s) FROM Secret s WHERE s.projectId = :projectId")
    Long countByProjectId(@Param("projectId") UUID projectId);
    
    // ============================================================================
    // Legacy Queries (for backwards compatibility during migration)
    // ============================================================================
    
    @Deprecated
    Optional<Secret> findBySecretKey(String secretKey);
    
    @Deprecated
    boolean existsBySecretKey(String secretKey);
    
    @Deprecated
    void deleteBySecretKey(String secretKey);
    
    @Deprecated
    Page<Secret> findByCreatedBy(String createdBy, Pageable pageable);
    
    @Deprecated
    @Query("SELECT s FROM Secret s WHERE s.secretKey LIKE %:keyword% OR s.createdBy LIKE %:keyword%")
    Page<Secret> searchSecrets(@Param("keyword") String keyword, Pageable pageable);
    
    // ============================================================================
    // Expiration Queries
    // ============================================================================
    
    @Query("SELECT s FROM Secret s WHERE s.expiresAt IS NOT NULL AND s.expiresAt <= :now")
    List<Secret> findExpiredSecrets(@Param("now") LocalDateTime now);
    
    @Query("SELECT s FROM Secret s WHERE s.projectId = :projectId " +
           "AND s.expiresAt IS NOT NULL AND s.expiresAt <= :now")
    List<Secret> findExpiredSecretsByProject(@Param("projectId") UUID projectId, @Param("now") LocalDateTime now);
    
    @Query("SELECT s FROM Secret s WHERE s.expiresAt IS NOT NULL AND s.expiresAt > :now " +
           "AND s.expiresAt <= :threshold")
    List<Secret> findSecretsExpiringBetween(
        @Param("now") LocalDateTime now, 
        @Param("threshold") LocalDateTime threshold
    );
}
