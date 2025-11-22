package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    /**
     * Google ID token from Firebase SDK
     * This is the primary authentication method with Google Cloud Identity Platform
     */
    @NotBlank(message = "idToken is required")
    private String idToken;
}

