package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;

public class ShareSecretRequest {
    
    @NotBlank(message = "Username or email of the user to share with is required")
    private String sharedWith;
    
    private String permission; // Optional: READ, WRITE, etc. Defaults to READ

    public ShareSecretRequest() {
    }

    public ShareSecretRequest(String sharedWith, String permission) {
        this.sharedWith = sharedWith;
        this.permission = permission;
    }

    public String getSharedWith() {
        return sharedWith;
    }

    public void setSharedWith(String sharedWith) {
        this.sharedWith = sharedWith;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }
}
