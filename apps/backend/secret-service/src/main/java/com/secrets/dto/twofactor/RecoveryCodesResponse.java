package com.secrets.dto.twofactor;

import java.util.List;

/**
 * Response containing recovery codes
 */
public class RecoveryCodesResponse {
    private List<String> recoveryCodes; // Plain text, shown only once

    public RecoveryCodesResponse() {
    }

    public RecoveryCodesResponse(List<String> recoveryCodes) {
        this.recoveryCodes = recoveryCodes;
    }

    public List<String> getRecoveryCodes() {
        return recoveryCodes;
    }

    public void setRecoveryCodes(List<String> recoveryCodes) {
        this.recoveryCodes = recoveryCodes;
    }
}

