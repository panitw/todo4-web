'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Group by
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupByOption)}>
          {GROUP_BY_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
