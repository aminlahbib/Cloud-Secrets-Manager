package com.secrets.dto.twofactor;

/**
 * Response for starting TOTP setup
 */
public class TotpStartResponse {
    private String qrCodeDataUrl; // Base64 encoded QR code image
    private String manualSecret; // Base32 secret for manual entry
    private String otpauthUrl; // Full otpauth:// URL

    public TotpStartResponse() {
    }

    public TotpStartResponse(String qrCodeDataUrl, String manualSecret, String otpauthUrl) {
        this.qrCodeDataUrl = qrCodeDataUrl;
        this.manualSecret = manualSecret;
        this.otpauthUrl = otpauthUrl;
    }

    public String getQrCodeDataUrl() {
        return qrCodeDataUrl;
    }

    public void setQrCodeDataUrl(String qrCodeDataUrl) {
        this.qrCodeDataUrl = qrCodeDataUrl;
    }

    public String getManualSecret() {
        return manualSecret;
    }

    public void setManualSecret(String manualSecret) {
        this.manualSecret = manualSecret;
    }

    public String getOtpauthUrl() {
        return otpauthUrl;
    }

    public void setOtpauthUrl(String otpauthUrl) {
        this.otpauthUrl = otpauthUrl;
    }
}

