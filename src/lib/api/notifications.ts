import { apiFetch } from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  taskId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
}

interface NotificationListResponse {
  data: Notification[];
  meta: NotificationListMeta;
}

export interface UnreadCountResponse {
  count: number;
}

export function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.unread) searchParams.set('unread', 'true');

  const qs = searchParams.toString();
  return apiFetch<NotificationListResponse>(
    `/api/v1/notifications${qs ? `?${qs}` : ''}`,
  );
}

export function fetchUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>('/api/v1/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/api/v1/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>('/api/v1/notifications/read-all', {
    method: 'PATCH',
  });
}
