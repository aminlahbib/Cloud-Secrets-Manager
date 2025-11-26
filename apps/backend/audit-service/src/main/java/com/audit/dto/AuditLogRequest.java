package com.audit.dto;

import jakarta.validation.constraints.NotBlank;

public class AuditLogRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Secret key is required")
    private String secretKey;

    @NotBlank(message = "Username is required")
    private String username;

    public AuditLogRequest() {
    }

    public AuditLogRequest(String action, String secretKey, String username) {
        this.action = action;
        this.secretKey = secretKey;
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
