import api from './api';
import type {
  Secret,
  SecretVersion,
  CreateSecretRequest,
  UpdateSecretRequest,
  MoveSecretRequest,
  CopySecretRequest,
  SecretsListParams,
  SecretsListResponse,
  SecretVersionDetail,
} from '../types';

const buildProjectSecretPath = (projectId: string, key: string, suffix: string = '') =>
  `/api/projects/${projectId}/secrets/${encodeURIComponent(key)}${suffix}`;

const normalizeSecret = (secret: Secret): Secret => {
  const normalizedKey = secret.secretKey || secret.key || '';
  return {
    ...secret,
    secretKey: normalizedKey,
    key: secret.key || normalizedKey,
  };
};

export const secretsService = {
  // ============================================================================
  // Project-Scoped Secret Operations (v3 API)
  // ============================================================================

  /**
   * List secrets in a project
   */
  async listProjectSecrets(projectId: string, params: SecretsListParams = {}): Promise<SecretsListResponse> {
    const { data } = await api.get(`/api/projects/${projectId}/secrets`, { params });
    const content = data.content?.map(normalizeSecret) ?? [];
    return { ...data, content };
  },

  /**
   * Get a single secret from a project
   */
  async getProjectSecret(projectId: string, key: string): Promise<Secret> {
    const { data } = await api.get(buildProjectSecretPath(projectId, key));
    return normalizeSecret(data);
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
    return normalizeSecret(data);
  },

  /**
   * Update a secret in a project
   */
  async updateProjectSecret(projectId: string, key: string, request: UpdateSecretRequest): Promise<Secret> {
    const payload = {
      key,
      value: request.value,
      description: request.description,
      expiresAt: request.expiresAt,
    };
    const { data } = await api.put(buildProjectSecretPath(projectId, key), payload);
    return normalizeSecret(data);
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
    return normalizeSecret(data);
  },

  /**
   * Move a secret to another project
   */
  async moveSecret(projectId: string, key: string, request: MoveSecretRequest): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, '/move'), request);
    return normalizeSecret(data);
  },

  /**
   * Copy a secret to another project
   */
  async copySecret(projectId: string, key: string, request: CopySecretRequest): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, '/copy'), request);
    return normalizeSecret(data);
  },

  /**
   * Get version history for a secret
   */
  async getProjectSecretVersions(projectId: string, key: string): Promise<SecretVersion[]> {
    const { data } = await api.get(buildProjectSecretPath(projectId, key, '/versions'));
    return data;
  },

  async getProjectSecretVersion(projectId: string, key: string, versionNumber: number): Promise<SecretVersionDetail> {
    const { data } = await api.get(
      buildProjectSecretPath(projectId, key, `/versions/${versionNumber}`)
    );
    return data;
  },

  async restoreProjectSecretVersion(projectId: string, key: string, versionNumber: number): Promise<Secret> {
    const { data } = await api.post(buildProjectSecretPath(projectId, key, `/versions/${versionNumber}/restore`));
    return normalizeSecret(data);
  },

};
