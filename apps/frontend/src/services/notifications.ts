import api from './api';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8082';

export const notificationsService = {
  async list(unreadOnly: boolean = false): Promise<NotificationDto[]> {
    const { data } = await api.get<NotificationDto[]>('/api/notifications', {
      params: { unreadOnly },
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
    const token = localStorage.getItem('accessToken');
    return `${NOTIFICATION_SERVICE_URL}/api/notifications/stream${token ? `?token=${token}` : ''}`;
  },
};


