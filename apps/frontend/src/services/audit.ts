import api from './api';
import type { AuditLog, PaginatedResponse } from '../types';

export interface AuditLogsParams {
  page?: number;
  size?: number;
  username?: string;
  action?: string;
  secretKey?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  resourceType?: string;
}

// Use the standard PaginatedResponse type
export type AuditLogsResponse = PaginatedResponse<AuditLog>;

export const auditService = {
  // List audit logs with filtering
  // Returns empty result if user doesn't have permission (403 is expected for non-admin users)
  async listAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsResponse> {
    try {
    const { data } = await api.get('/api/audit', { params });
    // Normalize response to match PaginatedResponse interface
    // Backend might return nested page object or flat structure
    if (data.page && typeof data.page === 'object') {
      return {
        content: data.content || [],
        page: data.page.number ?? 0,
        size: data.page.size ?? params.size ?? 20,
        totalElements: data.page.totalElements ?? 0,
        totalPages: data.page.totalPages ?? 0,
      };
    }
    return data;
    } catch (error: any) {
      // 403 Forbidden is expected for users without ADMIN/MANAGER roles
      // Return empty result instead of throwing error
      if (error.response?.status === 403) {
        return {
          content: [],
          page: 0,
          size: params.size ?? 20,
          totalElements: 0,
          totalPages: 0,
        };
      }
      // Re-throw other errors
      throw error;
    }
  },

  // Get single audit log
  async getAuditLog(id: string): Promise<AuditLog> {
    const { data } = await api.get(`/api/audit/${id}`);
    return data;
  },

  // Get project-scoped audit logs
  async getProjectAuditLogs(projectId: string, params: Omit<AuditLogsParams, 'projectId'> = {}): Promise<AuditLogsResponse> {
    try {
      const { data } = await api.get(`/api/audit/project/${projectId}`, { params });
      // Normalize response to match PaginatedResponse interface
      if (data.page && typeof data.page === 'object') {
        return {
          content: data.content || [],
          page: data.page.number ?? 0,
          size: data.page.size ?? params.size ?? 20,
          totalElements: data.page.totalElements ?? 0,
          totalPages: data.page.totalPages ?? 0,
        };
      }
      return data;
    } catch (error: any) {
      // 403 Forbidden is expected for users without access
      // Return empty result instead of throwing error
      if (error.response?.status === 403 || error.response?.status === 404) {
        return {
          content: [],
          page: 0,
          size: params.size ?? 20,
          totalElements: 0,
          totalPages: 0,
        };
      }
      // Re-throw other errors
      throw error;
    }
  },
};
