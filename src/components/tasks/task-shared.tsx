import React from 'react';

export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'Critical', p2: 'High', p3: 'Medium', p4: 'Low',
};

export const PRIORITY_COLORS: Record<string, string> = {
  p1: 'text-red-600', p2: 'text-orange-700', p3: 'text-blue-600', p4: 'text-slate-400',
};

// Single source of truth for status pill appearance across the task list and
// detail panel. Tweak once, both surfaces update.
export const STATUS_PILL_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  open: { bg: 'bg-zinc-100', text: 'text-zinc-700', label: 'To Do' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  closed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Done' },
  waiting_for_human: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Waiting' },
  pending_deletion: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Delete' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocked' },
  archived: { bg: 'bg-zinc-100', text: 'text-zinc-600', label: 'Archived' },
};

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-indigo-500" />
      <h3 className="shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">
        {children}
      </h3>
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent"
      />
    </div>
  );
}
