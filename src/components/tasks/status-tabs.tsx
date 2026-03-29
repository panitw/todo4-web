'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'active', label: 'Active', statuses: ['open', 'in_progress'] },
  { value: 'done', label: 'Done', statuses: ['closed'] },
] as const;

type StatusTabValue = (typeof STATUS_TABS)[number]['value'];

interface StatusTabsProps {
  activeTab: string | null;
  onTabChange: (tab: string | null, statuses: string[]) => void;
}

export function StatusTabs({ activeTab, onTabChange }: StatusTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    const currentIndex = STATUS_TABS.findIndex((t) => t.value === activeTab);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = currentIndex < STATUS_TABS.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : STATUS_TABS.length - 1;
    }

    if (nextIndex !== null) {
      const nextTab = STATUS_TABS[nextIndex];
      onTabChange(nextTab.value, [...nextTab.statuses]);
      const buttons = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  }

  function handleTabClick(value: StatusTabValue) {
    // Always keep one tab active — clicking the active tab is a no-op
    if (activeTab === value) return;
    const tab = STATUS_TABS.find((t) => t.value === value);
    onTabChange(value, tab ? [...tab.statuses] : []);
  }

  if (!mounted) return null;

  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label="Filter tasks by status"
      className="flex items-end gap-1 self-stretch"
      onKeyDown={handleKeyDown}
    >
      {STATUS_TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive || (!activeTab && tab.value === STATUS_TABS[0].value) ? 0 : -1}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              'px-3 py-2.5 -mb-px text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'text-indigo-600 border-indigo-600'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-gray-300',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
