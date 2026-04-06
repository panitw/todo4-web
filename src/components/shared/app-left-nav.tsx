'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/use-notifications';

const NAV_ITEMS = [
  { href: '/tasks', label: 'All Tasks', icon: '☰' },
  { href: '/archive', label: 'Archive', icon: '🗂' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
] as const;

const SETTINGS_ITEM = { href: '/settings', label: 'Settings', icon: '⚙' };

export function AppLeftNav() {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <nav
      aria-label="Application navigation"
      className="flex flex-col h-full py-3 gap-1"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              // On md (icon-only rail): hide label text via parent class
              'lg:flex md:justify-center lg:justify-start',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {/* Icon — always visible */}
            <span className="shrink-0 text-base leading-none lg:w-4 md:text-lg">
              {item.icon}
            </span>
            {/* Label — hidden on md icon-only rail, visible on lg */}
            <span className="hidden lg:inline truncate">{item.label}</span>
            {/* Unread notification count badge */}
            {item.href === '/notifications' && unreadCount > 0 && (
              <span className="hidden lg:inline ml-auto text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        );
      })}

      {/* Agents section */}
      <div className="mt-2 px-3 hidden lg:block">
        <p className="text-[11px] uppercase font-medium text-muted-foreground tracking-wide mb-1">
          Agents
        </p>
        <p className="text-xs text-muted-foreground/70 italic">
          No agents connected
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      {(() => {
        const active = pathname === SETTINGS_ITEM.href || pathname?.startsWith(SETTINGS_ITEM.href + '/');
        return (
          <Link
            href={SETTINGS_ITEM.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              'lg:flex md:justify-center lg:justify-start',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <span className="shrink-0 text-base leading-none lg:w-4 md:text-lg">
              {SETTINGS_ITEM.icon}
            </span>
            <span className="hidden lg:inline truncate">{SETTINGS_ITEM.label}</span>
          </Link>
        );
      })()}
    </nav>
  );
}
