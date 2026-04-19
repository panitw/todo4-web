'use client';

import React, { useState } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { MoreVertical, Calendar, Bot, Check as CheckIcon } from 'lucide-react';
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
import { useAgents } from '@/hooks/use-agents';
import { CloseTaskDialog } from './close-task-dialog';
import { AgentProvenanceBadge } from '@/components/shared/agent-provenance-badge';
import { STATUS_PILL_CONFIG } from './task-shared';

// --- Constants ---

const PRIORITY_CONFIG: Record<string, { dotClass: string; textClass: string; label: string }> = {
  p1: { dotClass: 'bg-red-600', textClass: 'text-red-600', label: 'Critical' },
  p2: { dotClass: 'bg-orange-700', textClass: 'text-orange-700', label: 'High' },
  p3: { dotClass: 'bg-blue-600', textClass: 'text-blue-600', label: 'Medium' },
  p4: { dotClass: 'bg-slate-400', textClass: 'text-slate-500', label: 'Low' },
};

// --- Helpers ---

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'closed' || task.status === 'archived') return false;
  return new Date(task.dueDate) < new Date();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// --- Helpers ---

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(lowerQuery);
    if (idx === -1) {
      parts.push(remaining);
      break;
    }
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(
      <mark key={keyIdx++} className="bg-yellow-200 rounded-sm px-0.5">
        {remaining.slice(idx, idx + query.length)}
      </mark>,
    );
    remaining = remaining.slice(idx + query.length);
  }
  return <>{parts}</>;
}

// --- Sub-components ---

function AgentStatusPip({ agentName }: { agentName: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-teal-700">
      <Bot className="h-3 w-3" aria-hidden="true" />
      <span>{agentName}</span>
    </span>
  );
}

// --- TaskCard ---

export interface TaskCardProps {
  task: Task;
  selected: boolean;
  highlighted?: boolean;
  focused?: boolean;
  editing?: boolean;
  searchQuery?: string;
  onSelect: (id: string) => void;
  onTagClick?: (tagName: string) => void;
  onCheckboxToggle?: (id: string) => void;
  onTitleSave?: (id: string, newTitle: string) => void;
  onEditCancel?: () => void;
  isBulkSelected?: boolean;
  isBulkMode?: boolean;
  onBulkSelect?: (id: string, checked: boolean) => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  selected,
  highlighted,
  focused,
  editing,
  searchQuery,
  onSelect,
  onTagClick,
  onCheckboxToggle,
  onTitleSave,
  onEditCancel,
  isBulkSelected,
  isBulkMode,
  onBulkSelect,
  isDragging,
}: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG['p4'];
  const statusPill = STATUS_PILL_CONFIG[task.status] ?? STATUS_PILL_CONFIG['open'];
  const overdue = isOverdue(task);
  const completed = task.status === 'closed';
  const inProgress = task.status === 'in_progress';
  const hasAgentTouch = task.agentNotes !== null;
  const hasAgentCreator = task.assignedAgentId !== null;

  const { data: agents } = useAgents();
  const creatorAgentName =
    (hasAgentCreator &&
      agents?.find((a) => a.id === task.assignedAgentId)?.name) ||
    'Agent';

  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const { mutate: archiveMutate } = useArchiveTask();
  const { mutate: restoreMutate } = useRestoreTask();
  const { mutate: deleteMutate } = useDeleteTask();

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = editTitle.trim();
      if (trimmed && trimmed !== task.title) {
        onTitleSave?.(task.id, trimmed);
      } else {
        onEditCancel?.();
      }
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      onEditCancel?.();
    }
  }

  function handleTitleBlur() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleSave?.(task.id, trimmed);
    } else {
      setEditTitle(task.title);
      onEditCancel?.();
    }
  }

  return (
    <>
      <div
        aria-label={`Task: ${task.title}, Priority: ${priority.label}, Status: ${statusPill.label}${task.dueDate ? `, Due: ${formatDate(task.dueDate)}` : ''}${overdue ? ', Overdue' : ''}`}
        tabIndex={-1}
        onClick={() => onSelect(task.id)}
        className={cn(
          'group relative cursor-pointer border-b border-border transition-colors',
          'p-3 md:p-4',
          // Left accent rail — reserved slot so rows don't jitter between states
          'border-l-2 border-l-transparent',
          // Focus indicator
          focused && 'outline outline-2 -outline-offset-2 outline-indigo-500',
          // Card states
          selected
            ? 'bg-indigo-50 border-l-indigo-600'
            : highlighted
              ? 'bg-emerald-50/60'
              : 'bg-transparent md:hover:bg-zinc-50',
          // Completed — muted styling applied per-element (title, bottom row), not whole card
          // In-progress title weight handled below
          isDragging && 'opacity-0',
        )}
      >
        <div className="flex gap-2.5">
          {/* Left column: checkboxes */}
          <div className="flex items-start gap-2.5 shrink-0 pt-1">
            {/* Bulk selection checkbox — only visible when bulk mode is active */}
            {onBulkSelect !== undefined && isBulkMode && (
              <Checkbox
                checked={isBulkSelected ?? false}
                onCheckedChange={(checked) => onBulkSelect(task.id, !!checked)}
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select "${task.title}" for bulk action`}
              />
            )}

            {/* Completion checkbox — 20px visual, 44px hit area via after pseudo */}
            <button
              type="button"
              role="checkbox"
              aria-checked={completed}
              aria-label={`Mark ${task.title} as complete`}
              onClick={(e) => {
                e.stopPropagation();
                onCheckboxToggle?.(task.id);
              }}
              className={cn(
                'group/check relative flex items-center justify-center shrink-0 size-5 border-[1.5px] rounded transition-colors after:absolute after:-inset-3',
                completed
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-zinc-100 hover:border-zinc-400 hover:text-zinc-400 active:bg-zinc-500 active:border-zinc-500 active:text-white'
                  : 'border-zinc-300 hover:border-zinc-500 active:border-emerald-600 active:bg-emerald-600',
              )}
            >
              {completed && <CheckIcon className="size-3.5" />}
              {!completed && (
                <>
                  <CheckIcon className="size-3.5 text-gray-400 opacity-0 group-hover/check:opacity-100 group-active/check:opacity-0" />
                  <CheckIcon className="size-3.5 text-white absolute opacity-0 group-active/check:opacity-100" />
                </>
              )}
            </button>
          </div>

          {/* Right column: title row + bottom row (naturally aligned) */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2.5">
              {/* Title */}
              {editing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleBlur}
                  onFocus={() => setEditTitle(task.title)}
                  autoFocus
                  className="flex-1 min-w-0 text-[0.9375rem] font-medium bg-transparent border-b border-indigo-500 outline-none px-0 py-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 min-w-0 truncate text-[0.9375rem]',
                    inProgress ? 'font-semibold' : 'font-medium',
                    completed && 'line-through text-muted-foreground',
                  )}
                >
                  <HighlightedText text={task.title} query={searchQuery} />
                </span>
              )}

              {/* Agent status pip (right side of top row for agent-touched) */}
              {hasAgentTouch && (
                <AgentStatusPip agentName="Agent" />
              )}

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Task actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}>
                Open
              </DropdownMenuItem>
              {onBulkSelect && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onBulkSelect(task.id, true); }}>
                  Select
                </DropdownMenuItem>
              )}
              {task.status !== 'closed' && task.status !== 'archived' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsCloseDialogOpen(true); }}>
                  Close
                </DropdownMenuItem>
              )}
              {task.status === 'closed' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  archiveMutate(task.id, {
                    onSuccess: () => showSuccess('Task archived'),
                    onError: () => showError('Failed to archive task'),
                  });
                }}>
                  Archive
                </DropdownMenuItem>
              )}
              {task.status === 'archived' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  restoreMutate(task.id, {
                    onSuccess: () => showSuccess('Task restored'),
                    onError: () => showError('Failed to restore task'),
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

            {/* Bottom row: tags + status pill + due date + priority */}
            <div className={cn('flex items-center gap-2 mt-2 flex-wrap', completed && 'opacity-60')}>
          {/* Tag chips */}
          {task.tags && task.tags.length > 0 && (
            <span className="hidden sm:flex items-center gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-600 bg-zinc-100/70',
                    onTagClick ? 'cursor-pointer hover:bg-zinc-200 hover:text-zinc-800' : 'cursor-default',
                  )}
                >
                  {tag}
                </button>
              ))}
            </span>
          )}

          {/* Status pill */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
              statusPill.bg,
              statusPill.text,
            )}
          >
            {statusPill.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[0.6875rem] font-medium',
                overdue ? 'text-red-600' : 'text-muted-foreground',
              )}
            >
              <Calendar className="size-3" aria-hidden="true" />
              <span>{formatDate(task.dueDate)}</span>
            </span>
          )}

          {/* Priority dot + label */}
          <span className={cn('inline-flex items-center gap-1 text-[0.6875rem] font-medium', priority.textClass)}>
            <span
              className={cn('size-1.5 shrink-0 rounded-full', priority.dotClass)}
              aria-hidden="true"
            />
            <span>{priority.label}</span>
          </span>

            {/* Agent provenance badge */}
            {hasAgentCreator && (
              <AgentProvenanceBadge
                agentName={creatorAgentName}
                variant="created"
              />
            )}
            </div>
          </div>
        </div>
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
                    showSuccess('Task deleted');
                  },
                  onError: () => showError('Failed to delete task'),
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
