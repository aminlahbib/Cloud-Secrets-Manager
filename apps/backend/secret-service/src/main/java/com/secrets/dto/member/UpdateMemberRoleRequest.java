package com.secrets.dto.member;

import com.secrets.entity.ProjectMembership;
import jakarta.validation.constraints.NotNull;

public class UpdateMemberRoleRequest {
    
    @NotNull(message = "Role is required")
    private ProjectMembership.ProjectRole role;

    public UpdateMemberRoleRequest() {
    }

    public ProjectMembership.ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectMembership.ProjectRole role) {
        this.role = role;
    }
}

