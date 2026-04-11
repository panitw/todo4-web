'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  Bot,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useUnreadCount,
} from '@/hooks/use-notifications';
import { EmptyState } from '@/components/shared/empty-state';
import type { Notification } from '@/lib/api/notifications';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationIcon({ type }: { type: string }) {
  const props = {
    size: 18,
    className: 'text-muted-foreground',
    'aria-hidden': true as const,
  };
  switch (type) {
    case 'task_created':
    case 'task_updated':
    case 'task_closed':
    case 'task_deletion_requested':
    case 'notify_human':
      return <Bot {...props} />;
    case 'overdue_nudge':
      return <Clock {...props} />;
    case 'token_expiry_warning':
    case 'token_expiry_final':
      return <AlertTriangle {...props} />;
    default:
      return <Bell {...props} />;
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    if (notification.taskId) {
      router.push(`/tasks?task=${encodeURIComponent(notification.taskId)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 p-4 border-b border-border transition-colors',
        'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset',
        isUnread ? 'bg-indigo-50/30' : 'bg-background',
      )}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 pt-1">
        {isUnread ? (
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            isUnread
              ? 'font-semibold text-foreground'
              : 'font-normal text-foreground',
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(notification.createdAt)}
      </span>
    </button>
  );
}

export default function NotificationsPage() {
  const [maxPage, setMaxPage] = useState(1);
  const limit = 20;

  // Fetch all loaded pages
  const pageQueries = Array.from({ length: maxPage }, (_, i) => i + 1);
  const queryResults = pageQueries.map((page) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useNotifications({ page, limit }),
  );

  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  // Accumulate all pages into a single list, deduped by id
  const { notifications, total, isLoading } = useMemo(() => {
    const seen = new Set<string>();
    const all: Notification[] = [];
    let totalCount = 0;
    let loading = false;

    for (const result of queryResults) {
      if (result.isLoading && all.length === 0) loading = true;
      if (result.data) {
        totalCount = result.data.meta?.total ?? totalCount;
        for (const n of result.data.data) {
          if (!seen.has(n.id)) {
            seen.add(n.id);
            all.push(n);
          }
        }
      }
    }
    return { notifications: all, total: totalCount, isLoading: loading };
  }, [queryResults]);

  const hasMore = maxPage * limit < total;
  const unreadCount = unreadData?.count ?? 0;

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead.mutate(id);
    },
    [markRead],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Actions bar */}
      <div className="flex items-center justify-end px-4 py-3">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <CheckCheck size={16} aria-hidden="true" />
            Mark all as read
          </button>
        )}
        {markAllRead.isError && (
          <span className="text-xs text-red-500">
            Failed to mark all as read
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="animate-spin text-muted-foreground"
              size={24}
            />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            heading="No notifications yet"
            description="Your agent will appear here when it takes action on your tasks."
          />
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkRead}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => setMaxPage((p) => p + 1)}
                  className={cn(
                    'text-sm font-medium text-indigo-600 hover:text-indigo-700',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-3 py-1.5',
                  )}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
