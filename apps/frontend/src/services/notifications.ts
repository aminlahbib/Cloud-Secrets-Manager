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
};


