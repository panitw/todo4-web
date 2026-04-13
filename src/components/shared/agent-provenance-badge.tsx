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
        'inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700',
        className,
      )}
    >
      <Bot className="size-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
