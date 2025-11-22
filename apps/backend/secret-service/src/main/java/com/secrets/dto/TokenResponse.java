package com.secrets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;  // For refresh token flow
    private String tokenType;
    private Long expiresIn;
    private String error;  // For error responses
}

