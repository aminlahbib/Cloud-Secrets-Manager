import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type NotificationDto } from '../services/notifications';

const notificationsKey = (userId: string) => ['notifications', userId];

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationDto[]>({
    queryKey: userId ? notificationsKey(userId) : ['notifications', 'anonymous'],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return notificationsService.list(userId, false);
    },
    enabled: !!userId,
    staleTime: 30_000,
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
    mutationFn: () => (userId ? notificationsService.markAllAsRead(userId) : Promise.resolve()),
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


