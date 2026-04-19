'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnreadCount } from '@/hooks/use-notifications';
import { UserMenu } from '@/components/layout/user-menu';
import { useSearch } from '@/providers/search-provider';
import { getProfile } from '@/lib/api/users';

function getPageTitle(pathname: string | null): string {
  if (!pathname) return 'todo4';
  if (pathname === '/tasks' || pathname.startsWith('/tasks/')) return 'Tasks';
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return 'Calendar';
  if (pathname.startsWith('/connections')) return 'Connections';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/task/')) return 'Task';
  return 'todo4';
}

export function MobileTopBar() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { query, setQuery, active: searchActive } = useSearch();
  const [searchModeRequested, setSearchModeRequested] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

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
      <header className="flex items-center gap-1 border-b border-zinc-200 bg-white px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={exitSearch}
          aria-label="Cancel search"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
          className="h-9 flex-1 bg-transparent px-2 text-[0.9375rem] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        )}
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] dark:border-zinc-800 dark:bg-zinc-900">
      <h1
        className="min-w-0 flex-1 truncate text-[1.25rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        suppressHydrationWarning
      >
        {pageTitle}
      </h1>
      <div className="flex items-center gap-1">
        {searchActive && (
          <button
            type="button"
            onClick={() => setSearchModeRequested(true)}
            aria-label="Search tasks"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
          className="relative flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
