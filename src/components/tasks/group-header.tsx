'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GroupHeaderProps {
  label: string;
  colorClass?: string;
}

export function GroupHeader({ label, colorClass }: GroupHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pb-2 pt-5" role="presentation">
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-indigo-500"
      />
      <span
        className={cn(
          'shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em]',
          colorClass ?? 'text-zinc-700',
        )}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent"
      />
    </div>
  );
}
