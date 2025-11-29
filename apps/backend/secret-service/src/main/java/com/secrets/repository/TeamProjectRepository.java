package com.secrets.repository;

import com.secrets.entity.TeamProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamProjectRepository extends JpaRepository<TeamProject, UUID> {
    
    /**
     * Find all projects for a team
     */
    List<TeamProject> findByTeamId(UUID teamId);
    
    /**
     * Find all teams a project belongs to
     */
    List<TeamProject> findByProjectId(UUID projectId);
    
    /**
     * Find specific team-project relationship
     */
    Optional<TeamProject> findByTeamIdAndProjectId(UUID teamId, UUID projectId);
    
    /**
     * Check if project is in team
     */
    boolean existsByTeamIdAndProjectId(UUID teamId, UUID projectId);
    
    /**
     * Count projects in a team
     */
    long countByTeamId(UUID teamId);
    
    /**
     * Delete all team-project relationships for a team
     */
    void deleteByTeamId(UUID teamId);
    
    /**
     * Delete all team-project relationships for a project
     */
    void deleteByProjectId(UUID projectId);
}

