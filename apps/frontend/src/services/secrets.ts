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

const buildSecretPath = (key: string, suffix: string = '') =>
  `/api/secrets/${encodeURIComponent(key)}${suffix}`;

export const secretsService = {
  // List secrets with pagination
  async listSecrets(params: SecretsListParams = {}): Promise<SecretsListResponse> {
    const { data } = await api.get('/api/secrets', { params });
    return data;
  },

  // Get single secret (key-based)
  async getSecret(key: string): Promise<Secret> {
    const { data } = await api.get(buildSecretPath(key));
    return data;
  },

  // Create secret
  async createSecret(secret: SecretRequest): Promise<Secret> {
    const { data } = await api.post('/api/secrets', secret);
    return data;
  },

  // Update secret
  async updateSecret(key: string, secret: SecretRequest): Promise<Secret> {
    const { data } = await api.put(buildSecretPath(key), secret);
    return data;
  },

  // Delete secret
  async deleteSecret(key: string): Promise<void> {
    await api.delete(buildSecretPath(key));
  },

  // Get secret versions
  async getSecretVersions(key: string): Promise<any[]> {
    const { data } = await api.get(buildSecretPath(key, '/versions'));
    return data;
  },

  // Share secret
  async shareSecret(key: string, userId: string, permission: string): Promise<void> {
    await api.post(buildSecretPath(key, '/share'), { userId, permission });
  },

  // Unshare secret
  async unshareSecret(key: string, userId: string): Promise<void> {
    await api.delete(buildSecretPath(key, `/share/${encodeURIComponent(userId)}`));
  },
};

