import api from './api';
import type { AuditLog } from '../types';

export interface AuditLogsParams {
  page?: number;
  size?: number;
  username?: string;  // Backend uses 'username' not 'user'
  action?: string;
  secretKey?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogsResponse {
  content: AuditLog[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export const auditService = {
  // List audit logs with filtering
  async listAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsResponse> {
    const { data } = await api.get('/api/audit', { params });
    return data;
  },

  // Get single audit log
  async getAuditLog(id: string): Promise<AuditLog> {
    const { data } = await api.get(`/api/audit/${id}`);
    return data;
  },
};

