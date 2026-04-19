'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ListTodo, Plug, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/connections', label: 'Connections', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(href + '/');
  }

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="flex items-stretch border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-900"
    >
      {TAB_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group/tab relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )}
          >
            <item.icon
              size={22}
              strokeWidth={active ? 2.25 : 1.75}
              aria-hidden="true"
              className="transition-colors"
            />
            <span className={cn('text-[11px] leading-tight', active && 'font-semibold')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
