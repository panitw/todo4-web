'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BrandWordmark } from '@/components/shared/brand-wordmark';
import { useUnreadCount } from '@/hooks/use-notifications';
import { UserMenu } from '@/components/layout/user-menu';
import { getProfile } from '@/lib/api/users';

export function MobileTopBar() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

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
        {profile && (
          <UserMenu
            name={profile.name}
            email={profile.email}
            profilePictureUrl={profile.profilePictureUrl}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
