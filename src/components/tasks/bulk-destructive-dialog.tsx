'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Task } from '@/lib/api/tasks';

interface BulkDestructiveDialogProps {
  action: 'archive' | 'delete' | null;
  selectedTasks: Task[];   // for preview only
  totalCount: number;      // actual number of IDs being acted upon
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDestructiveDialog({
  action,
  selectedTasks,
  totalCount,
  isPending,
  onConfirm,
  onCancel,
}: BulkDestructiveDialogProps) {
  const n = totalCount;
  const preview = selectedTasks.slice(0, 5);
  const extra = n - preview.length;

  const title =
    action === 'delete'
      ? `Delete ${n} task${n !== 1 ? 's' : ''}?`
      : `Archive ${n} task${n !== 1 ? 's' : ''}?`;

  const body =
    action === 'delete'
      ? `This will delete ${n} task${n !== 1 ? 's' : ''}. Deleted tasks can be restored from trash.`
      : `Archived tasks are hidden from your main list. You can view them in the Archived filter.`;

  const confirmLabel =
    action === 'delete'
      ? `Delete ${n} task${n !== 1 ? 's' : ''}`
      : `Archive ${n} task${n !== 1 ? 's' : ''}`;

  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
          <ul className="text-sm text-muted-foreground space-y-0.5 mt-2">
            {preview.map((task) => (
              <li key={task.id} className="truncate">• {task.title}</li>
            ))}
            {extra > 0 && (
              <li className="text-muted-foreground/70">…and {extra} more</li>
            )}
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Cancel is the default-focused element per UX-DR11 */}
          <AlertDialogCancel autoFocus disabled={isPending} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
          >
            {isPending ? 'Processing…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
