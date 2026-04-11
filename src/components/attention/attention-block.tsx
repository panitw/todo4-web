'use client';

import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { AttentionCard } from './attention-card';
import type { Task } from '@/lib/api/tasks';
import { useBulkAction } from '@/hooks/use-bulk-action';

export interface AttentionBlockProps {
  tasks: Task[];
  onSelectTask: (id: string) => void;
}

export function AttentionBlock({ tasks, onSelectTask }: AttentionBlockProps) {
  const { mutate: bulkMutate, isPending: isBulkApproving } = useBulkAction();

  const pendingConfirmationIds = useMemo(
    () => tasks.filter((t) => t.status === 'pending_deletion').map((t) => t.id),
    [tasks],
  );

  const count = tasks.length;

  function handleApproveAll() {
    if (pendingConfirmationIds.length === 0) return;
    bulkMutate(
      { ids: pendingConfirmationIds, action: 'delete' },
      {
        onSuccess: () => showSuccess(`${pendingConfirmationIds.length} tasks deleted`),
        onError: () => showError('Failed to approve all. Please try again.', { duration: Infinity }),
      },
    );
  }

  // No attention items — render nothing
  if (count === 0) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label={`Needs Attention — ${count} item${count !== 1 ? 's' : ''}`}
      className="border-l-4 border-l-amber-200 bg-amber-50 rounded-lg p-3 md:p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          Needs Attention{' '}
          <span
            className="inline-flex items-center justify-center ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-200 text-amber-800"
            aria-live="polite"
          >
            {count}
          </span>
        </h2>

        {/* Approve all button — visible when ≥3 pending_confirmation items */}
        {pendingConfirmationIds.length >= 3 && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBulkApproving}
            onClick={handleApproveAll}
          >
            {isBulkApproving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : null}
            Approve all
          </Button>
        )}
      </div>

      {/* Attention cards */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <AttentionCard
            key={task.id}
            task={task}
            onSelectTask={onSelectTask}
            disabled={isBulkApproving}
          />
        ))}
      </div>
    </section>
  );
}
