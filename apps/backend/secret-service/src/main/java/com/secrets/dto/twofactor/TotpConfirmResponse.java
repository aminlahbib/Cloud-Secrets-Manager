package com.secrets.dto.twofactor;

import java.util.List;

/**
 * Response after confirming TOTP setup
 */
public class TotpConfirmResponse {
    private boolean twoFactorEnabled;
    private List<String> recoveryCodes; // Plain text, shown only once

    public TotpConfirmResponse() {
    }

    public TotpConfirmResponse(boolean twoFactorEnabled, List<String> recoveryCodes) {
        this.twoFactorEnabled = twoFactorEnabled;
        this.recoveryCodes = recoveryCodes;
    }

    public boolean isTwoFactorEnabled() {
        return twoFactorEnabled;
    }

    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public List<String> getRecoveryCodes() {
        return recoveryCodes;
    }

    public void setRecoveryCodes(List<String> recoveryCodes) {
        this.recoveryCodes = recoveryCodes;
    }
}

