package com.secrets.repository;

import com.secrets.entity.Secret;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecretRepository extends JpaRepository<Secret, Long> {
    
    Optional<Secret> findBySecretKey(String secretKey);
    
    boolean existsBySecretKey(String secretKey);
    
    void deleteBySecretKey(String secretKey);
    
    // Pagination and filtering
    Page<Secret> findAll(Pageable pageable);
    
    Page<Secret> findByCreatedBy(String createdBy, Pageable pageable);
    
    @Query("SELECT s FROM Secret s WHERE s.secretKey LIKE %:keyword% OR s.createdBy LIKE %:keyword%")
    Page<Secret> searchSecrets(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT s FROM Secret s WHERE s.createdBy = :createdBy AND (s.secretKey LIKE %:keyword% OR s.createdBy LIKE %:keyword%)")
    Page<Secret> searchSecretsByCreator(@Param("createdBy") String createdBy, @Param("keyword") String keyword, Pageable pageable);
    
    // Expiration queries
    @Query("SELECT s FROM Secret s WHERE s.expiresAt IS NOT NULL AND s.expiresAt <= :now")
    List<Secret> findExpiredSecrets(@Param("now") java.time.LocalDateTime now);
    
    @Query("SELECT s FROM Secret s WHERE s.expiresAt IS NOT NULL AND s.expiresAt > :now AND s.expiresAt <= :threshold AND s.expired = false")
    List<Secret> findSecretsExpiringBetween(@Param("now") java.time.LocalDateTime now, @Param("threshold") java.time.LocalDateTime threshold);
}

