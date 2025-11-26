package com.secrets.repository;

import com.secrets.entity.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {
    Optional<ProjectInvitation> findByToken(String token);
    List<ProjectInvitation> findByEmail(String email);
    List<ProjectInvitation> findByProjectId(UUID projectId);
    List<ProjectInvitation> findByEmailAndStatus(String email, ProjectInvitation.InvitationStatus status);
    
    @Query("SELECT pi FROM ProjectInvitation pi WHERE pi.email = :email AND pi.status = 'PENDING' AND pi.expiresAt > :now")
    List<ProjectInvitation> findPendingInvitationsByEmail(@Param("email") String email, @Param("now") LocalDateTime now);
    
    @Query("SELECT pi FROM ProjectInvitation pi WHERE pi.status = 'PENDING' AND pi.expiresAt < :now")
    List<ProjectInvitation> findExpiredInvitations(@Param("now") LocalDateTime now);
}

