'use client';

import React, { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'open', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Done' },
] as const;

type StatusTabValue = (typeof STATUS_TABS)[number]['value'];

interface StatusTabsProps {
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export function StatusTabs({ activeStatus, onStatusChange }: StatusTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    const currentIndex = STATUS_TABS.findIndex((t) => t.value === activeStatus);
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
      onStatusChange(nextTab.value);
      // Focus the new tab
      const buttons = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  }

  function handleTabClick(value: StatusTabValue) {
    // Deselect if already active (no "All" tab — deselecting clears filter)
    onStatusChange(activeStatus === value ? null : value);
  }

  return (
    <>
      {/* Desktop / normal tabs */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Filter tasks by status"
        className="hidden sm:flex items-center gap-1"
        onKeyDown={handleKeyDown}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive || (!activeStatus && tab.value === STATUS_TABS[0].value) ? 0 : -1}
              onClick={() => handleTabClick(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors rounded-t-sm border-b-2',
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

      {/* Narrow screen dropdown */}
      <div className="sm:hidden relative">
        <select
          value={activeStatus ?? ''}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="appearance-none bg-transparent border border-border rounded px-3 py-1.5 pr-8 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter tasks by status"
        >
          <option value="">All</option>
          {STATUS_TABS.map((tab) => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </>
  );
}
