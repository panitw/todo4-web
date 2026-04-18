'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SortTasksBy } from '@/lib/api/tasks';

export type GroupByOption = 'none' | 'tag' | 'date' | 'priority';

const GROUP_BY_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'tag', label: 'Tag' },
  { value: 'date', label: 'Date' },
  { value: 'priority', label: 'Priority' },
];

const SORT_OPTIONS: { value: SortTasksBy; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due date' },
  { value: 'created_newest', label: 'Newest first' },
  { value: 'created_oldest', label: 'Oldest first' },
];

interface ViewSettingsButtonProps {
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
  onSort?: (by: SortTasksBy) => void;
  sortDisabled?: boolean;
}

export function ViewSettingsButton({
  groupBy,
  onGroupByChange,
  onSort,
  sortDisabled,
}: ViewSettingsButtonProps) {
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
        <DropdownMenuGroup>
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
        </DropdownMenuGroup>
        {onSort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sorting
              </DropdownMenuLabel>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  disabled={sortDisabled}
                  onSelect={() => onSort(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
