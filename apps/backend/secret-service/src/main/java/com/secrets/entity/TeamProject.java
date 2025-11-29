package com.secrets.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_projects", indexes = {
    @Index(name = "idx_team_projects_team_id", columnList = "teamId"),
    @Index(name = "idx_team_projects_project_id", columnList = "projectId")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_team_projects", columnNames = {"teamId", "projectId"})
})
@EntityListeners(AuditingEntityListener.class)
public class TeamProject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", insertable = false, updatable = false)
    private Team team;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    @Column(name = "added_by", nullable = false)
    private UUID addedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by", insertable = false, updatable = false)
    private User adder;

    @CreatedDate
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    public TeamProject() {
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
        if (team != null) {
            this.teamId = team.getId();
        }
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

    public UUID getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(UUID addedBy) {
        this.addedBy = addedBy;
    }

    public User getAdder() {
        return adder;
    }

    public void setAdder(User adder) {
        this.adder = adder;
        if (adder != null) {
            this.addedBy = adder.getId();
        }
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
}

