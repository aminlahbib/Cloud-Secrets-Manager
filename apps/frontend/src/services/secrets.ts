import api from './api';
import type { Secret, SharedSecret, SecretVersion, Permission } from '../types';

export interface SecretsListParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  createdBy?: string;
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
}

export interface ShareSecretPayload {
  sharedWith: string;
  permission?: Permission | string;
}

const buildSecretPath = (key: string, suffix: string = '') =>
  `/api/secrets/${encodeURIComponent(key)}${suffix}`;

export const secretsService = {
  // List secrets with pagination
  async listSecrets(params: SecretsListParams = {}): Promise<SecretsListResponse> {
    const { data } = await api.get('/api/secrets', {
      params: {
        ...params,
      },
    });
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
  async getSecretVersions(key: string): Promise<SecretVersion[]> {
    const { data } = await api.get(buildSecretPath(key, '/versions'));
    return data;
  },

  // Get users a secret is shared with
  async getSharedUsers(key: string): Promise<SharedSecret[]> {
    const { data } = await api.get(buildSecretPath(key, '/shared'));
    return data;
  },

  // Share secret
  async shareSecret(key: string, payload: ShareSecretPayload): Promise<void> {
    await api.post(buildSecretPath(key, '/share'), payload);
  },

  // Unshare secret
  async unshareSecret(key: string, sharedWith: string): Promise<void> {
    await api.delete(buildSecretPath(key, `/share/${encodeURIComponent(sharedWith)}`));
  },

  // Rotate secret value
  async rotateSecret(key: string): Promise<Secret> {
    const { data } = await api.post(buildSecretPath(key, '/rotate'));
    return data;
  },

  // Set expiration
  async setExpiration(key: string, expiresAt: string): Promise<Secret> {
    const { data } = await api.post(buildSecretPath(key, '/expiration'), { expiresAt });
    return data;
  },

  // Remove expiration
  async removeExpiration(key: string): Promise<Secret> {
    const { data } = await api.delete(buildSecretPath(key, '/expiration'));
    return data;
  },
};

