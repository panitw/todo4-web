'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { MoreVertical, Calendar, Bot } from 'lucide-react';
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
import { AgentProvenanceBadge } from '@/components/shared/agent-provenance-badge';

// --- Constants ---

const PRIORITY_CONFIG: Record<string, { dotClass: string; textClass: string; label: string }> = {
  p1: { dotClass: 'bg-[#dc2626]', textClass: 'text-[#dc2626]', label: 'Critical' },
  p2: { dotClass: 'bg-[#f97316]', textClass: 'text-[#f97316]', label: 'High' },
  p3: { dotClass: 'bg-[#3b82f6]', textClass: 'text-[#3b82f6]', label: 'Medium' },
  p4: { dotClass: 'bg-[#94a3b8]', textClass: 'text-[#94a3b8]', label: 'Low' },
};

const STATUS_PILL_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  open: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'To Do' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  closed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
  waiting_for_human: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Waiting' },
  pending_deletion: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Delete' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocked' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Archived' },
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
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// --- Sub-components ---

function AgentStatusPip({ agentName }: { agentName: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-teal-700">
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
        role="button"
        aria-label={`Task: ${task.title}, Priority: ${priority.label}, Status: ${statusPill.label}${task.dueDate ? `, Due: ${formatDate(task.dueDate)}` : ''}${overdue ? ', Overdue' : ''}`}
        tabIndex={-1}
        onClick={() => onSelect(task.id)}
        className={cn(
          'group relative rounded-lg border shadow-sm transition-colors cursor-pointer',
          'p-3 md:p-4',
          'border-[#e2e8f0]',
          // Focus indicator
          focused && 'outline outline-2 outline-offset-2 outline-indigo-500',
          // Card states
          selected
            ? 'bg-[#EEF2FF] border-l-2 border-l-indigo-500'
            : highlighted
              ? 'bg-green-50'
              : 'bg-white md:hover:bg-[#f8fafc]',
          // Agent-touched (always visible per AC#3)
          hasAgentTouch && !selected && 'border-l-2 border-l-teal-500 bg-teal-50/50',
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
            <Checkbox
              checked={completed}
              aria-label={`Mark ${task.title} as complete`}
              onClick={(e) => {
                e.stopPropagation();
                onCheckboxToggle?.(task.id);
              }}
              className={cn(
                'shrink-0 size-5 border-[1.5px] border-[#cbd5e1] rounded after:absolute after:-inset-3',
                completed && 'data-checked:bg-green-600 data-checked:border-green-600',
              )}
            />
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
                  className="flex-1 min-w-0 text-[15px] font-medium bg-transparent border-b border-indigo-300 outline-none px-0 py-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 min-w-0 truncate text-[15px]',
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

            {/* Bottom row: tags + status pill + due date + priority */}
            <div className={cn('flex items-center gap-2 mt-2 flex-wrap', completed && 'opacity-60')}>
          {/* Tag chips */}
          {task.tags && task.tags.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5">
              {task.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[12px] bg-[#f1f5f9] text-[#475569]',
                    onTagClick ? 'cursor-pointer hover:bg-slate-200' : 'cursor-default',
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
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
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
                'inline-flex items-center gap-1 text-[12px]',
                overdue ? 'text-[#dc2626]' : 'text-muted-foreground',
              )}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatDate(task.dueDate)}</span>
            </span>
          )}

          {/* Priority dot + label */}
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', priority.textClass)}>
            <span
              className={cn('w-[7px] h-[7px] rounded-full shrink-0', priority.dotClass)}
              aria-hidden="true"
            />
            <span>{priority.label}</span>
          </span>

            {/* Agent provenance badge */}
            {hasAgentCreator && (
              <AgentProvenanceBadge agentName="Agent" variant="created" />
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
