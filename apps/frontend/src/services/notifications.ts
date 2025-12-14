import api from './api';
import { tokenStorage } from '../utils/tokenStorage';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationPage {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8082';

export const notificationsService = {
  async list(filters: NotificationFilters = {}): Promise<NotificationPage> {
    const { unreadOnly = false, type, startDate, endDate, page = 0, size = 50 } = filters;
    const params: Record<string, any> = { unreadOnly, page, size };
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const { data } = await api.get<NotificationPage>(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      params,
    });
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.post(`/api/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifications/read-all');
  },

  getStreamUrl(): string {
    const token = tokenStorage.getAccessToken();
    return `${NOTIFICATION_SERVICE_URL}/api/notifications/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  async sendTestNotification(type: string = 'SECRET_EXPIRING_SOON'): Promise<NotificationDto> {
    const token = tokenStorage.getAccessToken();
    const { data } = await api.post<NotificationDto>(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/test?type=${type}`,
      {},
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      }
    );
    return data;
  },

  async trackOpen(id: string): Promise<void> {
    await api.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/analytics/${id}/open`);
  },

  async trackAction(id: string, action: string): Promise<void> {
    await api.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/analytics/${id}/action`, null, {
      params: { action },
    });
  },

  async getAnalyticsSummary(): Promise<{ totalOpens: number; totalClicks: number }> {
    const { data } = await api.get<{ totalOpens: number; totalClicks: number }>(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/analytics/summary`
    );
    return data;
  },
};


