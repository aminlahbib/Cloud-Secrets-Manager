package com.audit.repository;

import com.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUsername(String username);
    
    List<AuditLog> findBySecretKey(String secretKey);
    
    List<AuditLog> findByAction(String action);
    
    Page<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    Page<AuditLog> findByUsernameAndTimestampBetween(
        String username, 
        LocalDateTime start, 
        LocalDateTime end, 
        Pageable pageable
    );
}

