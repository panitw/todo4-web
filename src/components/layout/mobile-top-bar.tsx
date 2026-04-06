'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/shared/brand-wordmark';
import { useUnreadCount } from '@/hooks/use-notifications';

export function MobileTopBar() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="flex items-center justify-between px-4 py-2">
      <BrandWordmark variant="mobile" className="text-[22px]" />
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          onKeyDown={(e) => {
            if (e.key === ' ') {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          className="relative text-muted-foreground"
        >
          <Bell size={24} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>
        <Link href="/settings" aria-label="Settings" className="text-muted-foreground">
          <Settings size={24} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
