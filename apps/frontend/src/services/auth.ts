import api from './api';
import type { LoginRequest, LoginResponse, User, PlatformRole } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
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
    };
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};

