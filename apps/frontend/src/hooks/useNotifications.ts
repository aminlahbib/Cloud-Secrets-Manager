import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { notificationsService, type NotificationFilters } from '../services/notifications';
import { useNotificationStream } from './useNotificationStream';

const notificationsKey = (userId: string | undefined, filters?: NotificationFilters) => 
  userId ? ['notifications', userId, filters] : ['notifications', 'anonymous', filters];

export const useNotifications = (userId?: string, filters?: NotificationFilters) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: notificationsKey(userId, filters),
    queryFn: () => {
      if (!userId) {
        return Promise.resolve({ content: [], totalElements: 0, totalPages: 0, size: 50, number: 0, first: true, last: true });
      }
      return notificationsService.list(filters || {});
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes (SSE handles real-time updates)
  });

  // Memoize callbacks to prevent SSE reconnection on every render
  const handleNotification = useCallback(() => {
    // Invalidate cache when new notification arrives via SSE
    if (userId) {
      queryClient.invalidateQueries({ queryKey: notificationsKey(userId) });
    }
  }, [userId, queryClient]);

  const handleError = useCallback((error: Event) => {
    console.warn('SSE connection error, falling back to polling:', error);
  }, []);

  // Set up SSE stream for real-time notifications
  useNotificationStream({
    enabled: !!userId,
    onNotification: handleNotification,
    onError: handleError,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: notificationsKey(userId) });
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => (userId ? notificationsService.markAllAsRead() : Promise.resolve()),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: notificationsKey(userId) });
      }
    },
  });

  const notifications = notificationsQuery.data?.content ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notificationsQuery,
    notifications,
    unreadCount,
    totalElements: notificationsQuery.data?.totalElements ?? 0,
    totalPages: notificationsQuery.data?.totalPages ?? 0,
    currentPage: notificationsQuery.data?.number ?? 0,
    pageSize: notificationsQuery.data?.size ?? 50,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAll: markAllAsReadMutation.isPending,
  };
};


