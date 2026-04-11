import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type NotificationListMeta,
} from '@/lib/api/notifications';

export function useNotifications(opts?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}) {
  return useQuery<{ data: Notification[]; meta: NotificationListMeta }>({
    queryKey: ['notifications', opts],
    queryFn: () => fetchNotifications(opts),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => fetchUnreadCount(),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Optimistically update unread count
      queryClient.setQueryData<{ count: number }>(
        ['notifications', 'unread-count'],
        (old) => (old ? { count: Math.max(0, old.count - 1) } : old),
      );

      return { id };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Optimistically set unread count to 0
      queryClient.setQueryData<{ count: number }>(
        ['notifications', 'unread-count'],
        () => ({ count: 0 }),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
