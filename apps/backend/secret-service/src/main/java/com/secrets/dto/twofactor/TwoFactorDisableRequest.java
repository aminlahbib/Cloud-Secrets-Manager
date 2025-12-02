package com.secrets.dto.twofactor;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to disable two-factor authentication
 */
public class TwoFactorDisableRequest {
    @NotBlank(message = "Code or recovery code is required")
    private String code; // TOTP code or recovery code

    public TwoFactorDisableRequest() {
    }

    public TwoFactorDisableRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

