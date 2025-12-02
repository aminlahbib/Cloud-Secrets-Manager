package com.secrets.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserResponse {
    private String id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role;
    private List<String> permissions;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public UserResponse() {
    }

    public UserResponse(String id, String email, String role, List<String> permissions, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.permissions = permissions;
        this.active = active;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public static UserResponseBuilder builder() {
        return new UserResponseBuilder();
    }

    public static class UserResponseBuilder {
        private String id;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String role;
        private List<String> permissions;
        private boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;

        public UserResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public UserResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public UserResponseBuilder permissions(List<String> permissions) {
            this.permissions = permissions;
            return this;
        }

        public UserResponseBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public UserResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserResponseBuilder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }

        public UserResponseBuilder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public UserResponseBuilder lastLoginAt(LocalDateTime lastLoginAt) {
            this.lastLoginAt = lastLoginAt;
            return this;
        }

        public UserResponse build() {
            UserResponse response = new UserResponse(id, email, role, permissions, active, createdAt);
            response.setDisplayName(displayName);
            response.setAvatarUrl(avatarUrl);
            response.setLastLoginAt(lastLoginAt);
            return response;
        }
    }
}

