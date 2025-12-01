import api from './api';
import type { Notification } from '@/types';

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
  async list(userId: string, unreadOnly: boolean = false): Promise<NotificationDto[]> {
    const { data } = await api.get<NotificationDto[]>('/api/notifications', {
      params: {
        userId,
        unreadOnly,
      },
    });
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.post(`/api/notifications/${id}/read`);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await api.post('/api/notifications/read-all', null, {
      params: { userId },
    });
  },
};


