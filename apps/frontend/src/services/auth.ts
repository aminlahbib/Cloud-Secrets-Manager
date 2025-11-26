import api from './api';
import type { LoginRequest, LoginResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { data } = await api.post('/api/v1/auth/refresh', { refreshToken });
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me');
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};

