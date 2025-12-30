package com.secrets.repository;

import com.secrets.entity.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, UUID> {
    @Query("SELECT pm FROM ProjectMembership pm LEFT JOIN FETCH pm.user WHERE pm.projectId = :projectId")
    List<ProjectMembership> findByProjectId(@Param("projectId") UUID projectId);
    
    List<ProjectMembership> findByUserId(UUID userId);
    Optional<ProjectMembership> findByProjectIdAndUserId(UUID projectId, UUID userId);
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
    void deleteByProjectIdAndUserId(UUID projectId, UUID userId);
    
    @Query("SELECT COUNT(pm) FROM ProjectMembership pm WHERE pm.projectId = :projectId")
    Long countByProjectId(@Param("projectId") UUID projectId);
    
    @Query("SELECT pm FROM ProjectMembership pm WHERE pm.projectId = :projectId AND pm.role = :role")
    List<ProjectMembership> findByProjectIdAndRole(
        @Param("projectId") UUID projectId, 
        @Param("role") ProjectMembership.ProjectRole role
    );
    
    @Query("SELECT COUNT(pm) FROM ProjectMembership pm WHERE pm.projectId = :projectId AND pm.role = 'OWNER'")
    Long countOwnersByProjectId(@Param("projectId") UUID projectId);
}

