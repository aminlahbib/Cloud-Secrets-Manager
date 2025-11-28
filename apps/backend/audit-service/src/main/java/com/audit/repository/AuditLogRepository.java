package com.audit.repository;

import com.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
    // Project-scoped queries
    Page<AuditLog> findByProjectId(UUID projectId, Pageable pageable);
    
    Page<AuditLog> findByProjectIdAndAction(UUID projectId, String action, Pageable pageable);
    
    Page<AuditLog> findByProjectIdAndResourceType(UUID projectId, String resourceType, Pageable pageable);
    
    Page<AuditLog> findByProjectIdAndCreatedAtBetween(
        UUID projectId, 
        LocalDateTime start, 
        LocalDateTime end, 
        Pageable pageable
    );
    
    // User-scoped queries
    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);
    
    List<AuditLog> findByUserId(UUID userId);
    
    Page<AuditLog> findByUserIdAndCreatedAtBetween(
        UUID userId, 
        LocalDateTime start, 
        LocalDateTime end, 
        Pageable pageable
    );
    
    // Resource-scoped queries
    Page<AuditLog> findByResourceTypeAndResourceId(String resourceType, String resourceId, Pageable pageable);
    
    List<AuditLog> findByResourceTypeAndResourceId(String resourceType, String resourceId);
    
    // Action-based queries
    Page<AuditLog> findByAction(String action, Pageable pageable);
    
    List<AuditLog> findByAction(String action);
    
    // Date range queries
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    // Combined queries
    Page<AuditLog> findByProjectIdAndUserIdAndCreatedAtBetween(
        UUID projectId,
        UUID userId,
        LocalDateTime start,
        LocalDateTime end,
        Pageable pageable
    );
    
    
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
    
    // Analytics aggregation queries
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.projectId = :projectId " +
           "AND a.createdAt >= :start AND a.createdAt <= :end")
    long countByProjectIdAndDateRange(
        @Param("projectId") UUID projectId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT a.action, COUNT(a) as count FROM AuditLog a " +
           "WHERE a.projectId = :projectId AND a.createdAt >= :start AND a.createdAt <= :end " +
           "GROUP BY a.action ORDER BY count DESC")
    List<Object[]> countActionsByType(
        @Param("projectId") UUID projectId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT a.userId, COUNT(a) as count FROM AuditLog a " +
           "WHERE a.projectId = :projectId AND a.createdAt >= :start AND a.createdAt <= :end " +
           "GROUP BY a.userId ORDER BY count DESC")
    List<Object[]> countActionsByUser(
        @Param("projectId") UUID projectId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT DATE(a.createdAt) as day, COUNT(a) as count FROM AuditLog a " +
           "WHERE a.projectId = :projectId AND a.createdAt >= :start AND a.createdAt <= :end " +
           "GROUP BY DATE(a.createdAt) ORDER BY day ASC")
    List<Object[]> countActionsByDay(
        @Param("projectId") UUID projectId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
}
