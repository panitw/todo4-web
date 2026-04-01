'use client';

import React, { useEffect } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBulkAction } from '@/hooks/use-bulk-action';
import { BulkDestructiveDialog } from './bulk-destructive-dialog';
import type { Task } from '@/lib/api/tasks';

interface BulkActionBarProps {
  selectedIds: string[];
  selectedTasks: Task[];
  onClear: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedIds,
  selectedTasks,
  onClear,
  onSuccess,
}: BulkActionBarProps) {
  const { mutate: runBulkAction, isPending } = useBulkAction();
  const [destructiveAction, setDestructiveAction] = React.useState<'archive' | 'delete' | null>(null);

  // Escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClear();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClear]);

  function handleMarkComplete() {
    runBulkAction(
      { ids: selectedIds, action: 'close' },
      {
        onSuccess: (result) => {
          showSuccess(`${result.processed} task${result.processed !== 1 ? 's' : ''} marked complete`);
          onSuccess();
        },
        onError: () => showError('Failed to mark tasks complete', {
          action: { label: 'Retry', onClick: handleMarkComplete },
        }),
      },
    );
  }

  function handleSetPriority(priority: string) {
    runBulkAction(
      { ids: selectedIds, action: 'set_priority', priority },
      {
        onSuccess: (result) => {
          showSuccess(`Priority updated for ${result.processed} task${result.processed !== 1 ? 's' : ''}`);
          onSuccess();
        },
        onError: () => showError('Failed to set priority', {
          action: { label: 'Retry', onClick: () => handleSetPriority(priority) },
        }),
      },
    );
  }

  function handleDestructiveConfirm() {
    if (!destructiveAction) return;
    runBulkAction(
      { ids: selectedIds, action: destructiveAction },
      {
        onSuccess: (result) => {
          const label = destructiveAction === 'archive' ? 'archived' : 'deleted';
          showSuccess(`${result.processed} task${result.processed !== 1 ? 's' : ''} ${label}`);
          setDestructiveAction(null);
          onSuccess();
        },
        onError: () => {
          showError(`Failed to ${destructiveAction} tasks`, {
            action: { label: 'Retry', onClick: handleDestructiveConfirm },
          });
          setDestructiveAction(null);
          // selection preserved (onSuccess NOT called)
        },
      },
    );
  }

  const n = selectedIds.length;

  return (
    <>
      <div
        role="toolbar"
        aria-label={`Bulk actions for ${n} selected task${n !== 1 ? 's' : ''}`}
        className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-background shadow-[0_-2px_8px_rgba(0,0,0,0.08)] z-20"
      >
        <span className="text-sm text-muted-foreground mr-2 shrink-0">
          {n} task{n !== 1 ? 's' : ''} selected
        </span>

        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={handleMarkComplete}
        >
          Mark complete
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="secondary" disabled={isPending} type="button">
              Set priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => (
              <DropdownMenuItem key={p} onClick={() => handleSetPriority(p)}>
                {p.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => setDestructiveAction('archive')}
        >
          Archive
        </Button>

        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => setDestructiveAction('delete')}
        >
          Delete
        </Button>

        <button
          className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:underline shrink-0"
          onClick={onClear}
        >
          Clear selection
        </button>
      </div>

      <BulkDestructiveDialog
        action={destructiveAction}
        selectedTasks={selectedTasks}
        totalCount={selectedIds.length}
        isPending={isPending}
        onConfirm={handleDestructiveConfirm}
        onCancel={() => setDestructiveAction(null)}
      />
    </>
  );
}
