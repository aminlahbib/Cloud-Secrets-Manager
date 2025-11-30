package com.secrets.dto.team;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TeamMemberRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "TEAM_OWNER|TEAM_ADMIN|TEAM_MEMBER", 
             message = "Role must be TEAM_OWNER, TEAM_ADMIN, or TEAM_MEMBER")
    private String role = "TEAM_MEMBER";

    public TeamMemberRequest() {
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
}

