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
      className="flex items-center bg-white border-t border-border h-14"
    >
      {TAB_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
              active ? 'text-blue-600' : 'text-muted-foreground',
            )}
          >
            <item.icon size={24} />
            <span className="text-[11px] leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
