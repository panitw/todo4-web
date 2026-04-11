import React from 'react';

export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'Critical', p2: 'High', p3: 'Medium', p4: 'Low',
};

export const PRIORITY_COLORS: Record<string, string> = {
  p1: 'text-red-600', p2: 'text-orange-700', p3: 'text-blue-600', p4: 'text-gray-400',
};

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-[13px] font-semibold text-indigo-400 uppercase tracking-wide whitespace-nowrap shrink-0">{children}</h3>
      <span className="flex-1 h-px bg-indigo-200" aria-hidden="true" />
    </div>
  );
}
