import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { notificationsService, type NotificationDto } from '../services/notifications';
import { useNotificationStream } from './useNotificationStream';

const notificationsKey = (userId: string) => ['notifications', userId];

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationDto[]>({
    queryKey: userId ? notificationsKey(userId) : ['notifications', 'anonymous'],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
	    return notificationsService.list(false);
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

  const unreadCount =
    notificationsQuery.data?.filter((n) => !n.readAt).length ?? 0;

  return {
    notificationsQuery,
    notifications: notificationsQuery.data ?? [],
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAll: markAllAsReadMutation.isPending,
  };
};


