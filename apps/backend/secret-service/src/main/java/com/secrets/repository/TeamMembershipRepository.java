package com.secrets.repository;

import com.secrets.entity.TeamMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMembershipRepository extends JpaRepository<TeamMembership, UUID> {
    
    /**
     * Find all memberships for a team
     */
    List<TeamMembership> findByTeamId(UUID teamId);
    
    /**
     * Find all teams a user is a member of
     */
    List<TeamMembership> findByUserId(UUID userId);
    
    /**
     * Find specific membership
     */
    Optional<TeamMembership> findByTeamIdAndUserId(UUID teamId, UUID userId);
    
    /**
     * Check if user is a member of team
     */
    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);
    
    /**
     * Count members in a team
     */
    long countByTeamId(UUID teamId);
    
    /**
     * Find all team owners
     */
    @Query("SELECT m FROM TeamMembership m WHERE m.teamId = :teamId AND m.role = 'TEAM_OWNER'")
    List<TeamMembership> findTeamOwners(@Param("teamId") UUID teamId);
    
    /**
     * Count team owners
     */
    @Query("SELECT COUNT(m) FROM TeamMembership m WHERE m.teamId = :teamId AND m.role = 'TEAM_OWNER'")
    long countTeamOwners(@Param("teamId") UUID teamId);
    
    /**
     * Check if user has access to project via team membership
     * Returns true if user is a member of any team that has access to the project
     */
    @Query("SELECT COUNT(tm) > 0 FROM TeamMembership tm " +
           "JOIN TeamProject tp ON tp.teamId = tm.teamId " +
           "WHERE tp.projectId = :projectId AND tm.userId = :userId")
    boolean hasTeamAccessToProject(@Param("projectId") UUID projectId, @Param("userId") UUID userId);
}

