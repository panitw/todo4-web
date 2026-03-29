'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentProvenanceBadgeProps {
  agentName: string;
  variant?: 'created' | 'modified';
  className?: string;
}

export function AgentProvenanceBadge({
  agentName,
  variant = 'created',
  className,
}: AgentProvenanceBadgeProps) {
  const label = variant === 'modified' ? `Modified by ${agentName}` : `Created by ${agentName}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
        'bg-[#ede9fe] text-[#6d28d9]',
        className,
      )}
    >
      <Bot className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
