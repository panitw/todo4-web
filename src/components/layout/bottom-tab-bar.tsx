'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, Link as LinkIcon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/connections', label: 'Connections', icon: LinkIcon },
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
      className="flex h-14 items-center bg-zinc-950"
    >
      {TAB_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group/tab relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
              active ? 'text-white' : 'text-zinc-400 hover:text-white',
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-violet-400"
              />
            )}
            <item.icon
              size={22}
              strokeWidth={active ? 2 : 1.75}
              className={cn(
                'transition-colors',
                active ? 'text-violet-300' : 'text-zinc-500 group-hover/tab:text-zinc-300',
              )}
            />
            <span className={cn('text-[11px] leading-tight', active && 'font-medium')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
