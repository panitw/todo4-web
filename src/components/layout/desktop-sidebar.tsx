'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, Link as LinkIcon, Settings } from 'lucide-react';
import { BrandWordmark } from '@/components/shared/brand-wordmark';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/connections', label: 'Connections', icon: LinkIcon },
] as const;

const SETTINGS_ITEM = { href: '/settings', label: 'Settings', icon: Settings };

export function DesktopSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(href + '/');
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="flex flex-col h-full bg-[#1e2a3a]"
    >
      {/* Brand */}
      <div className="px-4 py-5">
        <BrandWordmark variant="sidebar" className="text-2xl" />
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'text-white bg-[#eff6ff]/10'
                  : 'text-[#e2e8f0] hover:text-white hover:bg-[#eff6ff]/5',
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings at bottom */}
      <div className="px-3 pb-4">
        <Link
          href={SETTINGS_ITEM.href}
          aria-current={isActive(SETTINGS_ITEM.href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            isActive(SETTINGS_ITEM.href)
              ? 'text-white bg-[#eff6ff]/10'
              : 'text-[#e2e8f0] hover:text-white hover:bg-[#eff6ff]/5',
          )}
        >
          <SETTINGS_ITEM.icon size={20} />
          <span>{SETTINGS_ITEM.label}</span>
        </Link>
      </div>
    </nav>
  );
}
