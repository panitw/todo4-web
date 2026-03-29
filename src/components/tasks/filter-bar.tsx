'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

export interface TaskFilters {
  priority: ('p1' | 'p2' | 'p3' | 'p4')[];
  status: string[];
  tags: string[];
  dueAfter: string;
  dueBefore: string;
  search: string;
}

export const DEFAULT_FILTERS: TaskFilters = {
  priority: [],
  status: [],
  tags: [],
  dueAfter: '',
  dueBefore: '',
  search: '',
};

export function isNonDefault(filters: TaskFilters): boolean {
  const priorityDiffers =
    filters.priority.length !== DEFAULT_FILTERS.priority.length ||
    !DEFAULT_FILTERS.priority.every((p) => filters.priority.includes(p));
  const hasStatus = filters.status.length > 0;
  const hasTags = filters.tags.length > 0;
  const hasDueRange = !!filters.dueAfter || !!filters.dueBefore;
  const hasSearch = filters.search.length > 0;
  return priorityDiffers || hasStatus || hasTags || hasDueRange || hasSearch;
}

// --- Chip color configs ---

const PRIORITY_CHIP_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
  p1: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', label: 'Critical' },
  p2: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', label: 'High' },
  p3: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', label: 'Medium' },
  p4: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', label: 'Low' },
};

// --- RemovableChip ---

function RemovableChip({
  label,
  bg,
  border,
  text,
  onRemove,
  ariaLabel,
}: {
  label: string;
  bg: string;
  border: string;
  text: string;
  onRemove: () => void;
  ariaLabel: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium shrink-0',
        bg,
        border,
        text,
      )}
    >
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:opacity-70 focus:outline-none"
        aria-label={ariaLabel}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// --- FilterBar (chips only — search is handled by layout top bar + mobile search row) ---

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClearAll?: () => void;
}

export function FilterBar({ filters, onChange, onClearAll }: FilterBarProps) {
  function removePriority(p: string) {
    onChange({ ...filters, priority: filters.priority.filter((x) => x !== p) as TaskFilters['priority'] });
  }

  function removeTag(t: string) {
    onChange({ ...filters, tags: filters.tags.filter((x) => x !== t) });
  }

  const hasChips = filters.priority.length > 0 || filters.tags.length > 0;

  if (!hasChips) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-background min-h-[40px]">
      {/* Priority chips */}
      {filters.priority.map((p) => {
        const config = PRIORITY_CHIP_CONFIG[p];
        if (!config) return null;
        return (
          <RemovableChip
            key={`priority-${p}`}
            label={config.label}
            bg={config.bg}
            border={config.border}
            text={config.text}
            onRemove={() => removePriority(p)}
            ariaLabel={`Remove ${config.label} priority filter`}
          />
        );
      })}

      {/* Tag chips */}
      {filters.tags.map((tag) => (
        <RemovableChip
          key={`tag-${tag}`}
          label={tag}
          bg="bg-gray-50"
          border="border-gray-300"
          text="text-gray-700"
          onRemove={() => removeTag(tag)}
          ariaLabel={`Remove ${tag} tag filter`}
        />
      ))}

      {/* Clear all button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ ...DEFAULT_FILTERS });
          onClearAll?.();
        }}
        className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        aria-label="Clear all filters"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
