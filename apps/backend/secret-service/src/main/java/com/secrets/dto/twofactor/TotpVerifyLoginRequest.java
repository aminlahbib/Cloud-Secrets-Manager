package com.secrets.dto.twofactor;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify TOTP code during login
 */
public class TotpVerifyLoginRequest {
    @NotBlank(message = "Intermediate token is required")
    private String intermediateToken;

    @NotBlank(message = "Code is required")
    private String code; // TOTP code or recovery code

    public TotpVerifyLoginRequest() {
    }

    public TotpVerifyLoginRequest(String intermediateToken, String code) {
        this.intermediateToken = intermediateToken;
        this.code = code;
    }

    public String getIntermediateToken() {
        return intermediateToken;
    }

    public void setIntermediateToken(String intermediateToken) {
        this.intermediateToken = intermediateToken;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

