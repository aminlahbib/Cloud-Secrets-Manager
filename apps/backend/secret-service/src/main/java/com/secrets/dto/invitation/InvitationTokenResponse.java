package com.secrets.dto.invitation;

import java.util.UUID;

/**
 * Public invitation details returned by token (for signup flow)
 * Contains minimal info needed for signup without requiring authentication
 */
public class InvitationTokenResponse {
    private String email;
    private String projectName;
    private UUID projectId;
    private String inviterName;
    private String inviterEmail;
    private String role;

    public InvitationTokenResponse() {
    }

    public InvitationTokenResponse(String email, String projectName, UUID projectId, 
                                   String inviterName, String inviterEmail, String role) {
        this.email = email;
        this.projectName = projectName;
        this.projectId = projectId;
        this.inviterName = inviterName;
        this.inviterEmail = inviterEmail;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getInviterName() {
        return inviterName;
    }

    public void setInviterName(String inviterName) {
        this.inviterName = inviterName;
    }

    public String getInviterEmail() {
        return inviterEmail;
    }

    public void setInviterEmail(String inviterEmail) {
        this.inviterEmail = inviterEmail;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

