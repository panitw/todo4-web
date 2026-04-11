'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnreadCount } from '@/hooks/use-notifications';
import { UserMenu } from '@/components/layout/user-menu';
import { useSearch } from '@/providers/search-provider';
import { getProfile } from '@/lib/api/users';

export function MobileTopBar() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { query, setQuery, active: searchActive } = useSearch();
  const [searchModeRequested, setSearchModeRequested] = useState(false);

  // Derive visibility from the request + whether a searchable page is mounted.
  // When the user navigates away from /tasks mid-search, searchActive flips
  // false and the search bar collapses without any effect-driven setState.
  const searchMode = searchModeRequested && searchActive;

  function exitSearch() {
    setQuery('');
    setSearchModeRequested(false);
  }

  if (searchMode) {
    return (
      <header className="flex items-center gap-1 bg-zinc-950 px-3 py-2">
        <button
          type="button"
          onClick={exitSearch}
          aria-label="Cancel search"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') exitSearch();
          }}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className="h-9 flex-1 bg-transparent px-2 text-[15px] text-white outline-none placeholder:text-zinc-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </header>
    );
  }

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
      <div className="flex items-center gap-1">
        {searchActive && (
          <button
            type="button"
            onClick={() => setSearchModeRequested(true)}
            aria-label="Search tasks"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Search size={20} />
          </button>
        )}
        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          onKeyDown={(e) => {
            if (e.key === ' ') {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          className="relative flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Bell size={20} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
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
