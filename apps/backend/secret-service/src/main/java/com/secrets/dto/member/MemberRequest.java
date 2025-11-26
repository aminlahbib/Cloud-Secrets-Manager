package com.secrets.dto.member;

import com.secrets.entity.ProjectMembership;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MemberRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotNull(message = "Role is required")
    private ProjectMembership.ProjectRole role;

    public MemberRequest() {
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
}

