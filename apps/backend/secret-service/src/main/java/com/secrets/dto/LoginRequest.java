package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    
    /**
     * Google ID token from Firebase SDK
     * This is the primary authentication method with Google Cloud Identity Platform
     */
    @NotBlank(message = "idToken is required")
    private String idToken;

    public LoginRequest() {
    }

    public LoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
