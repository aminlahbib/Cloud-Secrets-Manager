import api from './api';
import type { UserPreferencesResponse } from '../types';

export interface UserPreferencesRequest {
  notifications?: {
    email?: boolean;
    secretExpiration?: boolean;
    projectInvitations?: boolean;
    securityAlerts?: boolean;
  };
  timezone?: string;
  dateFormat?: string;
}

export const preferencesService = {
  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferencesResponse> {
    const { data } = await api.get<UserPreferencesResponse>('/api/auth/preferences');
    return data;
  },

  /**
   * Update current user's preferences
   */
  async updatePreferences(preferences: UserPreferencesRequest): Promise<UserPreferencesResponse> {
    const { data } = await api.put<UserPreferencesResponse>('/api/auth/preferences', preferences);
    return data;
  },
};

