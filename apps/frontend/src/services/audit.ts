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
}

// Use the standard PaginatedResponse type
export type AuditLogsResponse = PaginatedResponse<AuditLog>;

export const auditService = {
  // List audit logs with filtering
  async listAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsResponse> {
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
  },

  // Get single audit log
  async getAuditLog(id: string): Promise<AuditLog> {
    const { data } = await api.get(`/api/audit/${id}`);
    return data;
  },
};
