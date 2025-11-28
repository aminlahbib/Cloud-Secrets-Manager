import api from './api';
import type { AuditLog, PaginatedResponse } from '../types';

export interface AuditLogsParams {
  page?: number;
  size?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  resourceType?: string;
  userId?: string;
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
      let url = `/api/audit/project/${projectId}`;
      let requestParams: any = {
        page: params.page ?? 0,
        size: params.size ?? 20,
      };

      // If date range is provided, use the date-range endpoint
      // Backend expects 'start' and 'end' parameters with ISO 8601 format
      if (params.startDate && params.endDate) {
        url = `/api/audit/project/${projectId}/date-range`;
        requestParams = {
          start: params.startDate, // Already in ISO format from getDateRangeParams
          end: params.endDate,     // Already in ISO format from getDateRangeParams
          page: params.page ?? 0,
          size: params.size ?? 20,
        };
      }

      const { data } = await api.get(url, { params: requestParams });
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
      // 403 Forbidden: User doesn't have access to this project
      if (error.response?.status === 403) {
        const apiError = new Error('You do not have permission to view audit logs for this project.');
        (apiError as any).statusCode = 403;
        (apiError as any).isPermissionError = true;
        throw apiError;
      }
      // 404 Not Found: Project doesn't exist
      if (error.response?.status === 404) {
        const apiError = new Error('Project not found or you do not have access.');
        (apiError as any).statusCode = 404;
        throw apiError;
      }
      // Re-throw other errors with context
      const apiError = new Error(`Failed to load audit logs: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      (apiError as any).statusCode = error.response?.status;
      throw apiError;
    }
  },

  // Get project analytics (server-side aggregated)
  async getProjectAnalytics(projectId: string, startDate: string, endDate: string): Promise<any> {
    try {
      const { data } = await api.get(`/api/audit/project/${projectId}/analytics`, {
        params: {
          start: startDate,
          end: endDate,
        },
      });
      return data;
    } catch (error: any) {
      // 403 Forbidden: User doesn't have access to this project
      if (error.response?.status === 403) {
        const apiError = new Error('You do not have permission to view analytics for this project.');
        (apiError as any).statusCode = 403;
        (apiError as any).isPermissionError = true;
        throw apiError;
      }
      // 404 Not Found: Project doesn't exist
      if (error.response?.status === 404) {
        const apiError = new Error('Project not found or you do not have access.');
        (apiError as any).statusCode = 404;
        throw apiError;
      }
      // Re-throw other errors with context
      const apiError = new Error(`Failed to load analytics: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      (apiError as any).statusCode = error.response?.status;
      throw apiError;
    }
  },
};
