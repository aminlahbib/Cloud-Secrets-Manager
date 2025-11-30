package com.secrets.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateMemberRoleRequest {
    
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "TEAM_OWNER|TEAM_ADMIN|TEAM_MEMBER", 
             message = "Role must be TEAM_OWNER, TEAM_ADMIN, or TEAM_MEMBER")
    private String role;

    public UpdateMemberRoleRequest() {
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

