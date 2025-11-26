package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_invitations", indexes = {
    @Index(name = "idx_invitations_email", columnList = "email"),
    @Index(name = "idx_invitations_token", columnList = "token"),
    @Index(name = "idx_invitations_project", columnList = "projectId")
})
@EntityListeners(AuditingEntityListener.class)
public class ProjectInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ProjectMembership.ProjectRole role;

    @Column(name = "invited_by", nullable = false)
    private UUID invitedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", insertable = false, updatable = false)
    private User inviter;

    @Column(unique = true, nullable = false, length = 255)
    private String token;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private InvitationStatus status = InvitationStatus.PENDING;

    public enum InvitationStatus {
        PENDING,
        ACCEPTED,
        EXPIRED,
        REVOKED
    }

    public ProjectInvitation() {
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt) || status == InvitationStatus.EXPIRED;
    }

    public boolean isValid() {
        return status == InvitationStatus.PENDING && !isExpired();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
        if (project != null) {
            this.projectId = project.getId();
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ProjectMembership.ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectMembership.ProjectRole role) {
        this.role = role;
    }

    public UUID getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(UUID invitedBy) {
        this.invitedBy = invitedBy;
    }

    public User getInviter() {
        return inviter;
    }

    public void setInviter(User inviter) {
        this.inviter = inviter;
        if (inviter != null) {
            this.invitedBy = inviter.getId();
        }
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }
}

