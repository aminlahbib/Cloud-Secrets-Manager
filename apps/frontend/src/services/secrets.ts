import api from './api';
import type { Secret } from '../types';

export interface SecretsListParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
}

export interface SecretsListResponse {
  content: Secret[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface SecretRequest {
  key: string;
  value: string;
  description?: string;
  tags?: string[];
  expiresAt?: string;
}

export const secretsService = {
  // List secrets with pagination
  async listSecrets(params: SecretsListParams = {}): Promise<SecretsListResponse> {
    const { data } = await api.get('/api/secrets', { params });
    return data;
  },

  // Get single secret
  async getSecret(id: string): Promise<Secret> {
    const { data } = await api.get(`/api/secrets/${id}`);
    return data;
  },

  // Create secret
  async createSecret(secret: SecretRequest): Promise<Secret> {
    const { data } = await api.post('/api/secrets', secret);
    return data;
  },

  // Update secret
  async updateSecret(id: string, secret: SecretRequest): Promise<Secret> {
    const { data } = await api.put(`/api/secrets/${id}`, secret);
    return data;
  },

  // Delete secret
  async deleteSecret(id: string): Promise<void> {
    await api.delete(`/api/secrets/${id}`);
  },

  // Get secret versions
  async getSecretVersions(id: string): Promise<any[]> {
    const { data } = await api.get(`/api/secrets/${id}/versions`);
    return data;
  },

  // Share secret
  async shareSecret(id: string, userId: string, permission: string): Promise<void> {
    await api.post(`/api/secrets/${id}/share`, { userId, permission });
  },

  // Unshare secret
  async unshareSecret(id: string, userId: string): Promise<void> {
    await api.delete(`/api/secrets/${id}/share/${userId}`);
  },
};

