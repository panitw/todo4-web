'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TaskFilters {
  priority: ('p1' | 'p2' | 'p3' | 'p4')[];
  status: string[];
  tags: string[];
  dueAfter: string;
  dueBefore: string;
}

interface FilterChipBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  availableTags?: { name: string; namespace: string | null }[];
}

const DEFAULT_PRIORITY: TaskFilters['priority'] = [];

export const DEFAULT_FILTERS: TaskFilters = {
  priority: [...DEFAULT_PRIORITY],
  status: [],
  tags: [],
  dueAfter: '',
  dueBefore: '',
};

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
  { value: 'closed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function isNonDefault(filters: TaskFilters): boolean {
  const priorityDiffers =
    filters.priority.length !== DEFAULT_PRIORITY.length ||
    !DEFAULT_PRIORITY.every((p) => filters.priority.includes(p));
  const hasStatus = filters.status.length > 0;
  const hasTags = filters.tags.length > 0;
  const hasDueRange = !!filters.dueAfter || !!filters.dueBefore;
  return priorityDiffers || hasStatus || hasTags || hasDueRange;
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

export function FilterChipBar({ filters, onChange, availableTags }: FilterChipBarProps) {
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
    onChange({ priority: [...DEFAULT_PRIORITY], status: [], tags: [], dueAfter: '', dueBefore: '' });
  }

  const nonDefault = isNonDefault(filters);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
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

      {/* Tag filters — show active tag chips with ✕ to remove */}
      {filters.tags.length > 0 && (
        <>
          <span className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />
          {filters.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) })}
              className="px-2 py-0.5 rounded border text-[11px] bg-teal-50 border-teal-400 text-teal-700 flex items-center gap-1"
            >
              {tag} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </>
      )}

      {/* Tag selector dropdown — using native select for MVP simplicity */}
      {availableTags && availableTags.length > 0 && (
        <select
          className="text-[11px] border border-border rounded px-1 py-0.5 bg-muted text-muted-foreground"
          value=""
          onChange={(e) => {
            const tag = e.target.value;
            if (tag && !filters.tags.includes(tag)) {
              onChange({ ...filters, tags: [...filters.tags, tag] });
            }
          }}
        >
          <option value="">+ Tag</option>
          {availableTags
            .filter((t) => !filters.tags.includes(t.name))
            .map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
        </select>
      )}

      {/* Due date range */}
      <span className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />
      <label className="text-[11px] text-muted-foreground flex items-center gap-1">
        From
        <input
          type="date"
          value={filters.dueAfter}
          onChange={(e) => onChange({ ...filters, dueAfter: e.target.value })}
          className="text-[11px] border border-border rounded px-1 py-0.5 bg-background"
        />
      </label>
      <label className="text-[11px] text-muted-foreground flex items-center gap-1">
        To
        <input
          type="date"
          value={filters.dueBefore}
          onChange={(e) => onChange({ ...filters, dueBefore: e.target.value })}
          className="text-[11px] border border-border rounded px-1 py-0.5 bg-background"
        />
      </label>

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
