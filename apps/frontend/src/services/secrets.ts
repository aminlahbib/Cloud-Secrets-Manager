import api from './api';
import type { 
  Secret, 
  SecretVersion, 
  CreateSecretRequest,
  UpdateSecretRequest,
  MoveSecretRequest,
  CopySecretRequest,
  PaginatedResponse,
  Permission 
} from '../types';

export interface SecretsListParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface SecretsListResponse extends PaginatedResponse<Secret> {}

// Legacy types for backwards compatibility
export interface SecretRequest {
  key: string;
  value: string;
}

export interface ShareSecretPayload {
  sharedWith: string;
  permission?: Permission | string;
}

export interface SharedSecret {
  id: string | number;
  secretKey: string;
  sharedWith: string;
  sharedBy: string;
  permission: Permission | string;
  sharedAt: string;
}

const buildProjectSecretPath = (projectId: string, key: string, suffix: string = '') =>
  `/api/projects/${projectId}/secrets/${encodeURIComponent(key)}${suffix}`;

export const secretsService = {
  // ============================================================================
  // Project-Scoped Secret Operations (v3 API)
  // ============================================================================

  /**
   * List secrets in a project
   */
  async listProjectSecrets(projectId: string, params: SecretsListParams = {}): Promise<SecretsListResponse> {
    const { data } = await api.get(`/api/projects/${projectId}/secrets`, { params });
    return data;
  },

  /**
   * Get a single secret from a project
   */
  async getProjectSecret(projectId: string, key: string): Promise<Secret> {
    const { data } = await api.get(buildProjectSecretPath(projectId, key));
    return data;
  },

  /**
   * Create a secret in a project
   */
  async createProjectSecret(projectId: string, request: CreateSecretRequest): Promise<Secret> {
    // Backend expects 'key' not 'secretKey' in SecretRequest DTO
    const backendRequest = {
      key: request.secretKey,
      value: request.value,
      description: request.description,
    };
    const { data } = await api.post(`/api/projects/${projectId}/secrets`, backendRequest);
    return data;
  },

  /**
   * Update a secret in a project
   */
  async updateProjectSecret(projectId: string, key: string, request: UpdateSecretRequest): Promise<Secret> {
    const { data } = await api.put(buildProjectSecretPath(projectId, key), request);
    return data;
  },

  /**
   * Delete a secret from a project
   */
  async deleteProjectSecret(projectId: string, key: string): Promise<void> {
    await api.delete(buildProjectSecretPath(projectId, key));
  },

  /**
   * Rotate a secret in a project
   */
  async rotateProjectSecret(projectId: string, key: string): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, '/rotate'));
    return data;
  },

  /**
   * Move a secret to another project
   */
  async moveSecret(projectId: string, key: string, request: MoveSecretRequest): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, '/move'), request);
    return data;
  },

  /**
   * Copy a secret to another project
   */
  async copySecret(projectId: string, key: string, request: CopySecretRequest): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, '/copy'), request);
    return data;
  },

  /**
   * Get version history for a secret
   */
  async getProjectSecretVersions(projectId: string, key: string): Promise<SecretVersion[]> {
    const { data } = await api.get(buildProjectSecretPath(projectId, key, '/versions'));
    return data;
  },

  // ============================================================================
  // Legacy API (for backwards compatibility during migration)
  // ============================================================================

  /**
   * @deprecated Use listProjectSecrets instead
   */
  async listSecrets(params: SecretsListParams & { createdBy?: string } = {}): Promise<SecretsListResponse> {
    const { data } = await api.get('/api/secrets', { params });
    // Normalize secrets to include both key and secretKey
    if (data.content) {
      data.content = data.content.map((s: Secret) => ({
        ...s,
        key: s.key || s.secretKey,
        secretKey: s.secretKey || s.key,
      }));
    }
    return data;
  },

  /**
   * @deprecated Use getProjectSecret instead
   */
  async getSecret(key: string): Promise<Secret> {
    const { data } = await api.get(`/api/secrets/${encodeURIComponent(key)}`);
    // Normalize to include both key and secretKey
    return {
      ...data,
      key: data.key || data.secretKey,
      secretKey: data.secretKey || data.key,
    };
  },

  /**
   * @deprecated Use createProjectSecret instead
   */
  async createSecret(secret: SecretRequest): Promise<Secret> {
    const { data } = await api.post('/api/secrets', secret);
    return data;
  },

  /**
   * @deprecated Use updateProjectSecret instead
   */
  async updateSecret(key: string, secret: SecretRequest): Promise<Secret> {
    const { data } = await api.put(`/api/secrets/${encodeURIComponent(key)}`, secret);
    return data;
  },

  /**
   * @deprecated Use deleteProjectSecret instead
   */
  async deleteSecret(key: string): Promise<void> {
    await api.delete(`/api/secrets/${encodeURIComponent(key)}`);
  },

  /**
   * @deprecated Use getProjectSecretVersions instead
   */
  async getSecretVersions(key: string): Promise<SecretVersion[]> {
    const { data } = await api.get(`/api/secrets/${encodeURIComponent(key)}/versions`);
    return data;
  },

  /**
   * @deprecated Legacy sharing - will be removed in v3
   */
  async getSharedUsers(key: string): Promise<SharedSecret[]> {
    const { data } = await api.get(`/api/secrets/${encodeURIComponent(key)}/shared`);
    return data;
  },

  /**
   * @deprecated Legacy sharing - will be removed in v3
   */
  async shareSecret(key: string, payload: ShareSecretPayload): Promise<void> {
    await api.post(`/api/secrets/${encodeURIComponent(key)}/share`, payload);
  },

  /**
   * @deprecated Legacy sharing - will be removed in v3
   */
  async unshareSecret(key: string, sharedWith: string): Promise<void> {
    await api.delete(`/api/secrets/${encodeURIComponent(key)}/share/${encodeURIComponent(sharedWith)}`);
  },

  /**
   * @deprecated Use rotateProjectSecret instead
   */
  async rotateSecret(key: string): Promise<Secret> {
    const { data } = await api.post(`/api/secrets/${encodeURIComponent(key)}/rotate`);
    return data;
  },

  /**
   * @deprecated Will be removed in v3
   */
  async setExpiration(key: string, expiresAt: string): Promise<Secret> {
    const { data } = await api.post(`/api/secrets/${encodeURIComponent(key)}/expiration`, { expiresAt });
    return data;
  },

  /**
   * @deprecated Will be removed in v3
   */
  async removeExpiration(key: string): Promise<Secret> {
    const { data } = await api.delete(`/api/secrets/${encodeURIComponent(key)}/expiration`);
    return data;
  },
};
