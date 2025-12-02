import api from './api';
import type { LoginRequest, User, PlatformRole } from '@/types';

export interface TokenResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  requiresTwoFactor?: boolean;
  intermediateToken?: string;
  twoFactorType?: string;
  error?: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/api/auth/login', credentials);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const { data } = await api.post('/api/v1/auth/refresh', { refreshToken });
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<any>('/api/auth/me');
    // Map backend response to frontend User type
    return {
      id: data.id,
      firebaseUid: data.firebaseUid,
      email: data.email,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      platformRole: (data.role || data.platformRole || 'USER') as PlatformRole,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
      twoFactorEnabled: data.twoFactorEnabled,
      twoFactorType: data.twoFactorType,
    };
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};

