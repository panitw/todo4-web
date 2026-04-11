'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CheckSquare,
  Calendar,
  Link as LinkIcon,
  Search,
  Settings,
} from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/connections', label: 'Connections', icon: LinkIcon },
  { href: '/notifications', label: 'Notifications', icon: Bell },
] as const;

const SETTINGS_ITEM = { href: '/settings', label: 'Settings', icon: Settings };

interface DesktopSidebarProps {
  onOpenCommandPalette?: () => void;
}

export function DesktopSidebar({ onOpenCommandPalette }: DesktopSidebarProps = {}) {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(href + '/');
  }

  const renderNavItem = (item: typeof NAV_ITEMS[number] | typeof SETTINGS_ITEM) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-white/[0.06] text-white'
            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-white',
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-violet-400"
          />
        )}
        <item.icon
          size={18}
          strokeWidth={active ? 2 : 1.75}
          className={cn(
            'shrink-0 transition-colors',
            active ? 'text-violet-300' : 'text-zinc-500 group-hover:text-zinc-300',
          )}
        />
        <span className="flex-1">{item.label}</span>
        {item.href === '/notifications' && unreadCount > 0 && (
          <span className="rounded-full bg-violet-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="relative flex h-full flex-col border-r border-white/5 bg-zinc-950"
    >
      {/* Soft nebula halo echoing the cosmic 4 — sits behind the brand mark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 30% 0%, rgba(139, 92, 246, 0.18), transparent 70%)',
        }}
      />

      {/* Brand */}
      <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FAFAF7] shadow-[0_6px_20px_-4px_rgba(139,92,246,0.55),0_0_0_1px_rgba(255,255,255,0.08)]">
          <Image
            src="/todo4-logo.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="size-8"
            unoptimized
            priority
          />
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-white">
          todo4
        </span>
      </div>

      {/* Section label */}
      <div className="relative px-5 pb-2 pt-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          Workspace
        </span>
      </div>

      {/* Nav items */}
      <div className="relative flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(renderNavItem)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Cmd+K trigger */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Open quick search"
          className="group/search flex w-full items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
        >
          <Search size={13} className="text-zinc-500 transition-colors group-hover/search:text-zinc-300" />
          <span className="flex-1 text-xs text-zinc-400 transition-colors group-hover/search:text-zinc-200">
            Quick search
          </span>
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Settings at bottom */}
      <div className="border-t border-white/5 px-3 py-3">
        {renderNavItem(SETTINGS_ITEM)}
      </div>
    </nav>
  );
}
