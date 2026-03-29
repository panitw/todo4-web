'use client';

import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type GroupByOption = 'none' | 'tag' | 'date' | 'priority';

const GROUP_BY_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'tag', label: 'Tag' },
  { value: 'date', label: 'Date' },
  { value: 'priority', label: 'Priority' },
];

interface ViewSettingsButtonProps {
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
}

export function ViewSettingsButton({ groupBy, onGroupByChange }: ViewSettingsButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded hover:bg-muted hover:text-foreground transition-colors shrink-0"
        aria-haspopup="menu"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>View</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Group by
        </div>
        {GROUP_BY_OPTIONS.map((option) => {
          const isActive = groupBy === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              onClick={() => onGroupByChange(option.value)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer',
                isActive && 'font-medium',
              )}
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {isActive && <Check className="h-4 w-4" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
