'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { type Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import { useArchiveTask } from '@/hooks/use-archive-task';
import { useRestoreTask } from '@/hooks/use-restore-task';
import { useDeleteTask } from '@/hooks/use-delete-task';
import { CloseTaskDialog } from './close-task-dialog';

interface TaskRowProps {
  task: Task;
  selected: boolean;
  highlighted?: boolean;
  onSelect: (id: string) => void;
}

const PRIORITY_CONFIG: Record<
  string,
  { dotClass: string; label: string }
> = {
  p1: { dotClass: 'bg-red-500', label: 'P1' },
  p2: { dotClass: 'bg-orange-500', label: 'P2' },
  p3: { dotClass: 'bg-blue-500', label: 'P3' },
  p4: { dotClass: 'bg-gray-400', label: 'P4' },
};

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'closed' || task.status === 'archived') return false;
  return new Date(task.dueDate) < new Date();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TaskRow({ task, selected, highlighted, onSelect }: TaskRowProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG['p4'];
  const overdue = isOverdue(task);
  const completed = task.status === 'closed';
  const hasAgentTouch = task.agentNotes !== null;

  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: archiveMutate } = useArchiveTask();
  const { mutate: restoreMutate } = useRestoreTask();
  const { mutate: deleteMutate } = useDeleteTask();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(task.id);
    }
  };

  return (
    <>
      <div
        role="row"
        aria-selected={selected}
        tabIndex={0}
        onClick={() => onSelect(task.id)}
        onKeyDown={handleKeyDown}
        className={cn(
          'group flex items-center gap-2 px-3 min-h-[48px] md:min-h-[36px] cursor-pointer',
          'border-l-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          selected ? 'bg-indigo-50' : highlighted ? 'bg-green-50' : 'hover:bg-muted/50',
          hasAgentTouch ? 'border-teal-500' : 'border-transparent',
          completed && 'opacity-60',
        )}
      >
        {/* Completion checkbox */}
        <Checkbox
          checked={completed}
          aria-label={`Mark "${task.title}" complete`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />

        {/* Priority dot + text label (NFR25: never color alone) */}
        <span className="flex items-center gap-1 shrink-0">
          <span
            className={cn('w-2 h-2 rounded-full shrink-0', priority.dotClass)}
            aria-hidden="true"
          />
          <span className="text-[10px] font-medium uppercase text-muted-foreground leading-none">
            {priority.label}
          </span>
        </span>

        {/* Title */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            completed && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </span>

        {/* Due date chip */}
        {task.dueDate && (
          <span
            className={cn(
              'shrink-0 text-[11px] px-1.5 py-0.5 rounded border',
              overdue
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-muted border-border text-muted-foreground',
            )}
          >
            {formatDate(task.dueDate)}
          </span>
        )}

        {/* Action menu (visible on hover) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-muted"
            aria-label="Task actions"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-muted-foreground text-base leading-none">⋯</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}>
              Open
            </DropdownMenuItem>
            {task.status !== 'closed' && task.status !== 'archived' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsCloseDialogOpen(true); }}>
                Close
              </DropdownMenuItem>
            )}
            {task.status === 'closed' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                archiveMutate(task.id, {
                  onSuccess: () => toast.success('Task archived'),
                  onError: () => toast.error('Failed to archive task'),
                });
              }}>
                Archive
              </DropdownMenuItem>
            )}
            {task.status === 'archived' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                restoreMutate(task.id, {
                  onSuccess: () => toast.success('Task restored'),
                  onError: () => toast.error('Failed to restore task'),
                });
              }}>
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CloseTaskDialog
        taskId={task.id}
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be removed from your list. Soft-deleted tasks are permanently purged after one year.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteMutate(task.id, {
                  onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    toast.success('Task deleted');
                  },
                  onError: () => toast.error('Failed to delete task'),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
