package com.secrets.repository;

import com.secrets.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByIdAndIsArchivedFalse(UUID id);
    List<Project> findByCreatedByAndIsArchivedFalse(UUID createdBy);
    Page<Project> findByIsArchivedFalse(Pageable pageable);
    
    @Query("SELECT DISTINCT p FROM Project p " +
           "WHERE p.isArchived = false AND (" +
           "  EXISTS (SELECT 1 FROM ProjectMembership pm WHERE pm.projectId = p.id AND pm.userId = :userId) OR " +
           "  EXISTS (SELECT 1 FROM TeamProject tp JOIN TeamMembership tm ON tm.teamId = tp.teamId WHERE tp.projectId = p.id AND tm.userId = :userId)" +
           ")")
    Page<Project> findAccessibleProjectsByUserId(@Param("userId") UUID userId, Pageable pageable);
    
    @Query("SELECT DISTINCT p FROM Project p " +
           "WHERE EXISTS (SELECT 1 FROM ProjectMembership pm WHERE pm.projectId = p.id AND pm.userId = :userId) OR " +
           "      EXISTS (SELECT 1 FROM TeamProject tp JOIN TeamMembership tm ON tm.teamId = tp.teamId WHERE tp.projectId = p.id AND tm.userId = :userId)")
    Page<Project> findAccessibleProjectsByUserIdIncludingArchived(@Param("userId") UUID userId, Pageable pageable);
    
    @Query("SELECT DISTINCT p FROM Project p " +
           "WHERE p.isArchived = false AND (" +
           "  EXISTS (SELECT 1 FROM ProjectMembership pm WHERE pm.projectId = p.id AND pm.userId = :userId) OR " +
           "  EXISTS (SELECT 1 FROM TeamProject tp JOIN TeamMembership tm ON tm.teamId = tp.teamId WHERE tp.projectId = p.id AND tm.userId = :userId)" +
           ") AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> findAccessibleProjectsByUserIdAndSearch(
        @Param("userId") UUID userId, 
        @Param("search") String search, 
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT p FROM Project p " +
           "WHERE (EXISTS (SELECT 1 FROM ProjectMembership pm WHERE pm.projectId = p.id AND pm.userId = :userId) OR " +
           "       EXISTS (SELECT 1 FROM TeamProject tp JOIN TeamMembership tm ON tm.teamId = tp.teamId WHERE tp.projectId = p.id AND tm.userId = :userId)) " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> findAccessibleProjectsByUserIdAndSearchIncludingArchived(
        @Param("userId") UUID userId, 
        @Param("search") String search, 
        Pageable pageable
    );
    
    List<Project> findByIsArchivedTrueAndDeletedAtIsNotNull();
    List<Project> findByScheduledPermanentDeleteAtIsNotNull();
}

