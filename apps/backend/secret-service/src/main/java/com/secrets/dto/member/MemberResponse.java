package com.secrets.dto.member;

import com.secrets.entity.ProjectMembership;
import java.time.LocalDateTime;
import java.util.UUID;

public class MemberResponse {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private UserInfo user;
    private ProjectMembership.ProjectRole role;
    private UUID invitedBy;
    private LocalDateTime joinedAt;

    public MemberResponse() {
    }

    public static MemberResponse from(ProjectMembership membership) {
        MemberResponse response = new MemberResponse();
        response.setId(membership.getId());
        response.setProjectId(membership.getProjectId());
        response.setUserId(membership.getUserId());
        response.setRole(membership.getRole());
        response.setInvitedBy(membership.getInvitedBy());
        response.setJoinedAt(membership.getJoinedAt());
        
        if (membership.getUser() != null) {
            UserInfo userInfo = new UserInfo();
            userInfo.setId(membership.getUser().getId());
            userInfo.setEmail(membership.getUser().getEmail());
            userInfo.setDisplayName(membership.getUser().getDisplayName());
            userInfo.setAvatarUrl(membership.getUser().getAvatarUrl());
            response.setUser(userInfo);
        }
        
        return response;
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
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

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public static class UserInfo {
        private UUID id;
        private String email;
        private String displayName;
        private String avatarUrl;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }
}

