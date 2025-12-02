import api from './api';

export interface TotpStartResponse {
  qrCodeDataUrl: string;
  manualSecret: string;
  otpauthUrl: string;
}

export interface TotpConfirmResponse {
  twoFactorEnabled: boolean;
  recoveryCodes: string[];
}

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

export const twoFactorService = {
  /**
   * Start TOTP setup - generates secret and QR code
   */
  async startSetup(): Promise<TotpStartResponse> {
    const { data } = await api.post<TotpStartResponse>('/api/auth/2fa/totp/start');
    return data;
  },

  /**
   * Confirm TOTP setup with verification code
   */
  async confirmSetup(code: string): Promise<TotpConfirmResponse> {
    const { data } = await api.post<TotpConfirmResponse>('/api/auth/2fa/totp/confirm', { code });
    return data;
  },

  /**
   * Verify TOTP code during login
   */
  async verifyLogin(intermediateToken: string, code: string): Promise<{ accessToken: string; refreshToken: string; tokenType: string; expiresIn: number }> {
    const { data } = await api.post('/api/auth/2fa/totp/verify-login', {
      intermediateToken,
      code,
    });
    return data;
  },

  /**
   * Disable 2FA
   */
  async disable(code: string): Promise<{ message: string; twoFactorEnabled: boolean }> {
    const { data } = await api.post('/api/auth/2fa/disable', { code });
    return data;
  },

  /**
   * Regenerate recovery codes
   */
  async regenerateRecoveryCodes(): Promise<RecoveryCodesResponse> {
    const { data } = await api.post<RecoveryCodesResponse>('/api/auth/2fa/recovery-codes/regenerate');
    return data;
  },
};

