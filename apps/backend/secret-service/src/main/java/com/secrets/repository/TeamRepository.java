package com.secrets.repository;

import com.secrets.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    
    /**
     * Find all active teams
     */
    List<Team> findByIsActiveTrue();
    
    /**
     * Find teams created by a specific user
     */
    List<Team> findByCreatedByAndIsActiveTrue(UUID createdBy);
    
    /**
     * Find teams where user is a member
     */
    @Query("SELECT DISTINCT t FROM Team t " +
           "JOIN t.memberships m " +
           "WHERE m.userId = :userId AND t.isActive = true")
    List<Team> findTeamsByMemberUserId(@Param("userId") UUID userId);
    
    /**
     * Check if team exists and is active
     */
    boolean existsByIdAndIsActiveTrue(UUID id);
    
    /**
     * Find team by ID if active
     */
    Optional<Team> findByIdAndIsActiveTrue(UUID id);
}

