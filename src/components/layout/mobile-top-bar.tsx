'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnreadCount } from '@/hooks/use-notifications';
import { UserMenu } from '@/components/layout/user-menu';
import { getProfile } from '@/lib/api/users';

export function MobileTopBar() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  return (
    <header className="flex items-center justify-between bg-zinc-950 px-4 py-2">
      <Link href="/tasks" className="flex items-center gap-2.5" aria-label="todo4 home">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FAFAF7] shadow-[0_6px_20px_-4px_rgba(139,92,246,0.55),0_0_0_1px_rgba(255,255,255,0.08)]">
          <Image
            src="/todo4-logo.png"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="size-7"
            unoptimized
            priority
          />
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-white">
          todo4
        </span>
      </Link>
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
          className="relative text-zinc-400 transition-colors hover:text-white"
        >
          <Bell size={22} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500" />
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
