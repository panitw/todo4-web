'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TaskFilters {
  priority: ('p1' | 'p2' | 'p3' | 'p4')[];
  status: string[];
}

interface FilterChipBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const DEFAULT_PRIORITY: TaskFilters['priority'] = ['p1', 'p2'];

const PRIORITIES: { value: 'p1' | 'p2' | 'p3' | 'p4'; label: string }[] = [
  { value: 'p1', label: 'P1' },
  { value: 'p2', label: 'P2' },
  { value: 'p3', label: 'P3' },
  { value: 'p4', label: 'P4' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_human', label: 'Waiting' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'closed', label: 'Closed' },
];

function isNonDefault(filters: TaskFilters): boolean {
  const priorityDiffers =
    filters.priority.length !== DEFAULT_PRIORITY.length ||
    !DEFAULT_PRIORITY.every((p) => filters.priority.includes(p));
  const hasStatus = filters.status.length > 0;
  return priorityDiffers || hasStatus;
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded border text-[11px] uppercase font-medium transition-colors',
        active
          ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
          : 'bg-muted border-border text-muted-foreground hover:border-indigo-300',
      )}
    >
      {label}
    </button>
  );
}

export function FilterChipBar({ filters, onChange }: FilterChipBarProps) {
  function togglePriority(p: 'p1' | 'p2' | 'p3' | 'p4') {
    const next = filters.priority.includes(p)
      ? filters.priority.filter((x) => x !== p)
      : [...filters.priority, p];
    onChange({ ...filters, priority: next });
  }

  function toggleStatus(s: string) {
    const next = filters.status.includes(s)
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s];
    onChange({ ...filters, status: next });
  }

  function clearFilters() {
    onChange({ priority: [...DEFAULT_PRIORITY], status: [] });
  }

  const nonDefault = isNonDefault(filters);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border">
      {PRIORITIES.map((p) => (
        <ChipButton
          key={p.value}
          label={p.label}
          active={filters.priority.includes(p.value)}
          onClick={() => togglePriority(p.value)}
        />
      ))}

      <span className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />

      {STATUSES.map((s) => (
        <ChipButton
          key={s.value}
          label={s.label}
          active={filters.status.includes(s.value)}
          onClick={() => toggleStatus(s.value)}
        />
      ))}

      {nonDefault && (
        <button
          type="button"
          onClick={clearFilters}
          className="ml-1 text-[11px] text-muted-foreground underline hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
