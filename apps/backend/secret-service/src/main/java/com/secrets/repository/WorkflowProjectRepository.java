package com.secrets.repository;

import com.secrets.entity.WorkflowProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowProjectRepository extends JpaRepository<WorkflowProject, UUID> {
    List<WorkflowProject> findByWorkflowIdOrderByDisplayOrderAsc(UUID workflowId);
    Optional<WorkflowProject> findByWorkflowIdAndProjectId(UUID workflowId, UUID projectId);
    boolean existsByWorkflowIdAndProjectId(UUID workflowId, UUID projectId);
    void deleteByWorkflowIdAndProjectId(UUID workflowId, UUID projectId);
    
    @Query("SELECT wp FROM WorkflowProject wp WHERE wp.projectId = :projectId")
    List<WorkflowProject> findByProjectId(@Param("projectId") UUID projectId);
    
    @Query("SELECT MAX(wp.displayOrder) FROM WorkflowProject wp WHERE wp.workflowId = :workflowId")
    Integer findMaxDisplayOrderByWorkflowId(UUID workflowId);
}

