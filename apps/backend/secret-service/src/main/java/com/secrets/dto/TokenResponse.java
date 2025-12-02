package com.secrets.dto;

public class TokenResponse {
    private String accessToken;
    private String refreshToken;  // For refresh token flow
    private String tokenType;
    private Long expiresIn;
    private String error;  // For error responses
    private Boolean requiresTwoFactor; // true if 2FA is required
    private String intermediateToken; // Short-lived token for 2FA step
    private String twoFactorType; // "TOTP"

    public TokenResponse() {
    }

    public TokenResponse(String accessToken, String refreshToken, String tokenType, Long expiresIn, String error) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.error = error;
    }

    public Boolean getRequiresTwoFactor() {
        return requiresTwoFactor;
    }

    public void setRequiresTwoFactor(Boolean requiresTwoFactor) {
        this.requiresTwoFactor = requiresTwoFactor;
    }

    public String getIntermediateToken() {
        return intermediateToken;
    }

    public void setIntermediateToken(String intermediateToken) {
        this.intermediateToken = intermediateToken;
    }

    public String getTwoFactorType() {
        return twoFactorType;
    }

    public void setTwoFactorType(String twoFactorType) {
        this.twoFactorType = twoFactorType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public static TokenResponseBuilder builder() {
        return new TokenResponseBuilder();
    }

    public static class TokenResponseBuilder {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn;
        private String error;
        private Boolean requiresTwoFactor;
        private String intermediateToken;
        private String twoFactorType;

        public TokenResponseBuilder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public TokenResponseBuilder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public TokenResponseBuilder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public TokenResponseBuilder expiresIn(Long expiresIn) {
            this.expiresIn = expiresIn;
            return this;
        }

        public TokenResponseBuilder error(String error) {
            this.error = error;
            return this;
        }

        public TokenResponseBuilder requiresTwoFactor(Boolean requiresTwoFactor) {
            this.requiresTwoFactor = requiresTwoFactor;
            return this;
        }

        public TokenResponseBuilder intermediateToken(String intermediateToken) {
            this.intermediateToken = intermediateToken;
            return this;
        }

        public TokenResponseBuilder twoFactorType(String twoFactorType) {
            this.twoFactorType = twoFactorType;
            return this;
        }

        public TokenResponse build() {
            TokenResponse response = new TokenResponse(accessToken, refreshToken, tokenType, expiresIn, error);
            response.setRequiresTwoFactor(requiresTwoFactor);
            response.setIntermediateToken(intermediateToken);
            response.setTwoFactorType(twoFactorType);
            return response;
        }
    }
}
