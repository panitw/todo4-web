'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GroupHeaderProps {
  label: string;
  colorClass?: string;
}

export function GroupHeader({ label, colorClass }: GroupHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1" role="presentation">
      <span
        className={cn(
          'text-[13px] font-semibold uppercase tracking-wide whitespace-nowrap shrink-0',
          colorClass ?? 'text-indigo-400',
        )}
      >
        {label}
      </span>
      <span className="flex-1 h-px bg-indigo-200" aria-hidden="true" />
    </div>
  );
}
