package com.secrets.repository;

import com.secrets.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    List<Workflow> findByUserIdOrderByDisplayOrderAsc(UUID userId);
    Optional<Workflow> findByIdAndUserId(UUID id, UUID userId);
    Optional<Workflow> findByUserIdAndName(UUID userId, String name);
    Optional<Workflow> findByUserIdAndIsDefaultTrue(UUID userId);
    boolean existsByUserIdAndName(UUID userId, String name);
    
    @Query("SELECT MAX(w.displayOrder) FROM Workflow w WHERE w.userId = :userId")
    Integer findMaxDisplayOrderByUserId(UUID userId);
}

