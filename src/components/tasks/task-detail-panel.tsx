'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { Bot, X } from 'lucide-react';
import { type Task, type TaskHistory, type TaskComment } from '@/lib/api/tasks';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useTaskHistory } from '@/hooks/use-task-history';
import { useTaskComments } from '@/hooks/use-task-comments';
import { useCreateComment } from '@/hooks/use-create-comment';
import { useArchiveTask } from '@/hooks/use-archive-task';
import { useCloseTask } from '@/hooks/use-close-task';
import { SubtaskPanel } from './subtask-panel';
import { useRestoreTask } from '@/hooks/use-restore-task';
import { useDeleteTask } from '@/hooks/use-delete-task';
import { useTags } from '@/hooks/use-tags';
import { useAgents } from '@/hooks/use-agents';
import { CloseTaskDialog } from './close-task-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';
import {
  SectionHeader,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_PILL_CONFIG,
} from './task-shared';

// ─── Status Badge (read-only, for non-editable states) ──────────────────────

function StatusBadge({ status }: { status: Task['status'] }) {
  const config = STATUS_PILL_CONFIG[status] ?? STATUS_PILL_CONFIG.open;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Status Transition Button (JIRA-style) ─────────────────────────────────

type StatusActionVariant = 'gradient' | 'outline';

interface StatusAction {
  label: string;
  targetStatus: string;
  variant: StatusActionVariant;
}

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  open: [
    { label: 'Start Working', targetStatus: 'in_progress', variant: 'gradient' },
  ],
  in_progress: [
    { label: 'Done', targetStatus: 'closed', variant: 'gradient' },
    { label: 'To Do', targetStatus: 'open', variant: 'outline' },
  ],
  closed: [
    { label: 'Reopen', targetStatus: 'open', variant: 'outline' },
  ],
};

function StatusTransitionBar({ task }: { task: Task }) {
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateTask();
  const { mutate: closeMutate, isPending: isClosing } = useCloseTask();
  const isPending = isUpdating || isClosing;

  const actions = STATUS_ACTIONS[task.status];

  // Non-actionable statuses show a read-only badge
  if (!actions) return <StatusBadge status={task.status} />;

  function handleTransition(targetStatus: string) {
    if (targetStatus === 'closed') {
      closeMutate({ id: task.id, force: true }, {
        onError: () => showError('Failed to close task'),
      });
    } else {
      updateMutate({ id: task.id, data: { status: targetStatus as 'open' | 'in_progress' } }, {
        onError: () => showError('Failed to update status'),
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={task.status} />
      {actions.map((action) => (
        <Button
          key={action.targetStatus}
          type="button"
          variant={action.variant}
          size="sm"
          disabled={isPending}
          onClick={() => handleTransition(action.targetStatus)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

// ─── Agent Attribution Bar ──────────────────────────────────────────────────

function AgentAttributionBar({ task }: { task: Task }) {
  const { data: agents } = useAgents();
  if (!task.assignedAgentId) return null;
  const agentName =
    agents?.find((a) => a.id === task.assignedAgentId)?.name ?? 'Agent';
  const date = new Date(task.createdAt).toLocaleDateString();
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-200 text-xs text-teal-800">
      <Bot className="h-3.5 w-3.5 shrink-0" />
      <span>Created by <span className="font-medium">{agentName}</span> &middot; {date}</span>
    </div>
  );
}

// ─── Confirmation Action Bar ────────────────────────────────────────────────

function ConfirmationActionBar({ task, onClose }: { task: Task; onClose: () => void }) {
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteTask();
  const { mutate: restoreMutate, isPending: isRestoring } = useRestoreTask();

  if (task.status !== 'pending_deletion') return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <p className="flex-1 text-sm text-orange-800">Pending deletion — approve or reject.</p>
      <Button size="sm" variant="outline" disabled={isRestoring || isDeleting}
        onClick={() => restoreMutate(task.id, {
          onSuccess: () => showSuccess('Task restored'),
          onError: () => showError('Failed to restore task'),
        })}
        className="border-red-300 text-red-700 hover:bg-red-50"
      >Reject</Button>
      <Button size="sm" variant="gradient" disabled={isDeleting || isRestoring}
        onClick={() => deleteMutate(task.id, {
          onSuccess: () => { onClose(); showSuccess('Task deleted'); },
          onError: () => showError('Failed to delete task'),
        })}
      >Approve</Button>
    </div>
  );
}

// ─── Due Date Input (click-to-edit) ─────────────────────────────────────────

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function DueDateInput({ task }: { task: Task }) {
  const [localDate, setLocalDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : '');
  const [isEditing, setIsEditing] = useState(false);
  const { mutate } = useUpdateTask();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: syncs controlled input with server state on prop change
    setLocalDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
  }, [task.dueDate]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const serverDate = task.dueDate ? task.dueDate.substring(0, 10) : '';
    if (localDate === serverDate) return;
    // Validate date format before sending to server
    if (localDate && !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      setLocalDate(serverDate);
      showError('Invalid date format');
      return;
    }
    mutate({ id: task.id, data: { dueDate: localDate || null } }, {
      onError: () => { setLocalDate(serverDate); showError('Failed to update due date'); },
    });
  }, [localDate, task.dueDate, task.id, mutate]);

  if (isEditing) {
    return (
      <Input
        type="date"
        value={localDate}
        onChange={(e) => setLocalDate(e.target.value)}
        className="h-8 w-full text-xs"
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocalDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
            setIsEditing(false);
          }
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        autoFocus
        aria-label="Due date"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title={localDate ? new Date(localDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : undefined}
      aria-label={localDate ? `Due ${formatShortDate(localDate)}, click to edit` : 'Set due date'}
      className="-mx-1 flex h-8 w-[calc(100%+0.5rem)] items-center rounded-md px-2 text-left text-sm transition-colors hover:bg-zinc-200/60"
    >
      {localDate
        ? <span className="truncate text-foreground">{formatShortDate(localDate)}</span>
        : <span className="text-muted-foreground">Set date</span>
      }
    </button>
  );
}

// ─── Priority Select (controlled, borderless inside MetaCard) ───────────────

function PrioritySelect({ task }: { task: Task }) {
  const { mutate, isPending } = useUpdateTask();
  return (
    <Select
      value={task.priority}
      disabled={isPending}
      onValueChange={(v) => mutate(
        { id: task.id, data: { priority: v as Task['priority'] } },
        { onError: () => showError('Failed to update priority') },
      )}
    >
      <SelectTrigger
        aria-label="Priority"
        className="-mx-1 h-8 w-[calc(100%+0.5rem)] justify-start gap-2 border-0 bg-transparent px-2 text-sm shadow-none hover:bg-zinc-200/60 focus:ring-0 focus-visible:ring-0 data-[state=open]:bg-zinc-200/60"
      >
        <span className={PRIORITY_COLORS[task.priority]}>&#9679;</span>
        <span className="flex-1 text-left">{PRIORITY_LABELS[task.priority]}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="p1"><span className="text-red-600">&#9679;</span> Critical</SelectItem>
        <SelectItem value="p2"><span className="text-orange-700">&#9679;</span> High</SelectItem>
        <SelectItem value="p3"><span className="text-blue-600">&#9679;</span> Medium</SelectItem>
        <SelectItem value="p4"><span className="text-slate-400">&#9679;</span> Low</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Metadata Card ──────────────────────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function MetaCard({ task }: { task: Task }) {
  const createdFull = new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' });
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-border bg-zinc-50/60 p-3">
        <div className="grid grid-cols-2 gap-3">
          <MetaField label="Priority">
            <PrioritySelect task={task} />
          </MetaField>
          <MetaField label="Due">
            <DueDateInput task={task} />
          </MetaField>
        </div>
      </div>
      <p className="px-1 text-[11px] text-muted-foreground">
        Created{' '}
        <time dateTime={task.createdAt} title={createdFull} className="text-foreground/70">
          {formatShortDate(task.createdAt)}
        </time>
      </p>
    </div>
  );
}

// ─── Inline Editable Title ───────────────────────────────────────────────────

function InlineEditableTitle({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(task.title);
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useUpdateTask();
  const saveTriggeredRef = useRef(false);

  React.useEffect(() => { if (!isEditing) setLocalTitle(task.title); }, [task.title, isEditing]);

  function handleSave() {
    if (saveTriggeredRef.current) return;
    saveTriggeredRef.current = true;
    const trimmed = localTitle.trim();
    if (!trimmed) { showError('Title is required'); setLocalTitle(task.title); setIsEditing(false); saveTriggeredRef.current = false; return; }
    if (trimmed.length > 500) { setError('Max 500 characters'); saveTriggeredRef.current = false; return; }
    setError(null);
    if (trimmed === task.title) { setIsEditing(false); saveTriggeredRef.current = false; return; }
    mutate({ id: task.id, data: { title: trimmed } }, {
      onError: () => { setLocalTitle(task.title); showError('Failed to update title'); },
      onSettled: () => { setIsEditing(false); saveTriggeredRef.current = false; },
    });
  }

  if (!isEditing) {
    return (
      <h2 className="text-xl font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 leading-snug"
        onClick={() => setIsEditing(true)}>{localTitle}</h2>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Input autoFocus value={localTitle} disabled={isPending}
        onChange={(e) => { setLocalTitle(e.target.value); setError(null); }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
          if (e.key === 'Escape') { setLocalTitle(task.title); setIsEditing(false); setError(null); }
        }}
        maxLength={500} className="text-xl font-semibold h-auto py-0.5"
        aria-label="Task title"
        aria-invalid={!!error}
        aria-describedby={error ? 'detail-title-error' : undefined}
      />
      {error && <p id="detail-title-error" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Description Editor ──────────────────────────────────────────────────────

function DescriptionEditor({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDesc, setLocalDesc] = useState(task.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useUpdateTask();
  const saveTriggeredRef = useRef(false);

  React.useEffect(() => { if (!isEditing) setLocalDesc(task.description ?? ''); }, [task.description, isEditing]);

  function handleSave() {
    if (saveTriggeredRef.current) return;
    saveTriggeredRef.current = true;
    if (localDesc.length > 10000) { setError('Max 10,000 characters'); saveTriggeredRef.current = false; return; }
    setError(null);
    if (localDesc === (task.description ?? '')) { setIsEditing(false); saveTriggeredRef.current = false; return; }
    mutate({ id: task.id, data: { description: localDesc } }, {
      onError: () => { setLocalDesc(task.description ?? ''); showError('Failed to update description'); },
      onSettled: () => { setIsEditing(false); saveTriggeredRef.current = false; },
    });
  }

  if (!isEditing) {
    return (
      <div className="min-h-[40px] rounded px-2 py-1.5 cursor-pointer hover:bg-muted/50 text-sm whitespace-pre-wrap"
        onClick={() => setIsEditing(true)}>
        {task.description ?? <span className="text-muted-foreground italic">Click to add description...</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Textarea autoFocus value={localDesc}
        onChange={(e) => { setLocalDesc(e.target.value); setError(null); }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
          if (e.key === 'Escape') { setLocalDesc(task.description ?? ''); setIsEditing(false); setError(null); }
        }}
        maxLength={10000} className="min-h-[80px] text-sm"
        aria-label="Description"
        aria-invalid={!!error}
        aria-describedby={error ? 'detail-desc-error' : undefined}
      />
      {error && <p id="detail-desc-error" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── History Entry ───────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const FRIENDLY_FIELD_NAMES: Record<string, string> = {
  dueDate: 'due date',
  priority: 'priority',
  title: 'title',
  description: 'description',
  tags: 'tags',
  status: 'status',
};

function formatHistoryValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'none';
  if (field === 'dueDate' && typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  if (field === 'priority') {
    return PRIORITY_LABELS[String(value)] ?? String(value);
  }
  if (field === 'status') {
    return STATUS_PILL_CONFIG[String(value)]?.label ?? String(value);
  }
  return String(value);
}

function HistoryEntry({ entry }: { entry: TaskHistory }) {
  const details = entry.details as { field?: string; oldValue?: unknown; newValue?: unknown; reasoning?: string } | null;
  const isAgent = entry.actorType !== 'human';
  const actor = isAgent ? 'Agent' : 'You';
  const createdAt = new Date(entry.createdAt);
  const relative = formatRelativeTime(createdAt);
  const absolute = createdAt.toLocaleString();

  let message: React.ReactNode;
  if (entry.action === 'status_changed' && details?.newValue !== undefined) {
    message = (
      <>
        marked as{' '}
        <span className="font-medium text-foreground">
          {formatHistoryValue('status', details.newValue)}
        </span>
      </>
    );
  } else if (entry.action === 'field_updated' && details?.field) {
    const friendlyField = FRIENDLY_FIELD_NAMES[details.field] ?? details.field;
    const newVal = formatHistoryValue(details.field, details.newValue);
    if (newVal === 'none') {
      message = <>cleared {friendlyField}</>;
    } else {
      message = (
        <>
          updated {friendlyField} to{' '}
          <span className="font-medium text-foreground">{newVal}</span>
        </>
      );
    }
  } else if (entry.action === 'created') {
    message = <>created this task</>;
  } else {
    message = <>{entry.action.replace(/_/g, ' ')}</>;
  }

  return (
    <div className="flex items-start gap-3 py-2 text-xs border-b border-border last:border-0">
      <span
        aria-hidden="true"
        className={cn(
          'mt-1 size-1.5 shrink-0 rounded-full',
          isAgent ? 'bg-teal-500' : 'bg-indigo-500',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{actor}</span> {message}
        </p>
        {details?.reasoning && (
          <p className="mt-0.5 italic text-muted-foreground">{details.reasoning}</p>
        )}
      </div>
      <time
        dateTime={createdAt.toISOString()}
        title={absolute}
        className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground"
      >
        {relative}
      </time>
    </div>
  );
}

function HistorySection({ taskId }: { taskId: string }) {
  const { data: history, isPending } = useTaskHistory(taskId);

  if (isPending) return <div className="space-y-1.5 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-4 bg-muted rounded w-full" />)}</div>;
  if (!history || history.length === 0) return <p className="text-xs text-muted-foreground">No activity yet</p>;

  return <div>{history.map((entry) => <HistoryEntry key={entry.id} entry={entry} />)}</div>;
}

// ─── Comment Item ────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: TaskComment }) {
  return (
    <div className="py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className="font-medium">{comment.authorType}</span>
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
    </div>
  );
}

function CommentsSection({ taskId }: { taskId: string }) {
  const { data: comments, isPending } = useTaskComments(taskId);
  const { mutate: addComment, isPending: isSubmitting } = useCreateComment(taskId);
  const [body, setBody] = useState('');

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    addComment(trimmed, { onSuccess: () => setBody(''), onError: () => showError('Failed to add comment') });
  }

  return (
    <div className="flex flex-col gap-2">
      {isPending ? (
        <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
      ) : comments && comments.length > 0 ? (
        <div>{comments.map((c) => <CommentItem key={c.id} comment={c} />)}</div>
      ) : (
        <p className="text-xs text-muted-foreground">No comments yet</p>
      )}
      <div className="flex gap-2 items-end">
        <Textarea placeholder="Add a comment..." value={body}
          onChange={(e) => setBody(e.target.value)} className="text-sm min-h-[48px] flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          aria-label="Add a comment"
        />
        <Button size="sm" variant="gradient" disabled={isSubmitting || !body.trim()} onClick={handleSubmit}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}

// ─── Tags Editor ─────────────────────────────────────────────────────────────

function TagsEditor({ task }: { task: Task }) {
  const [localTags, setLocalTags] = useState(task.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { mutate } = useUpdateTask();
  const { data: existingTags } = useTags();
  const pendingTagsRef = useRef<string[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local tags with server when task prop updates (only if no pending mutation)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: syncs optimistic local state with server on prop change
  useEffect(() => { if (!pendingTagsRef.current) setLocalTags(task.tags ?? []); }, [task.tags]);

  function flushTags(newTags: string[]) {
    clearTimeout(debounceRef.current);
    pendingTagsRef.current = newTags;
    debounceRef.current = setTimeout(() => {
      const tagsToSave = pendingTagsRef.current;
      if (!tagsToSave) return;
      mutate({ id: task.id, data: { tags: tagsToSave } }, {
        onError: () => { setLocalTags(task.tags ?? []); showError('Failed to update tags'); },
        onSettled: () => { pendingTagsRef.current = null; },
      });
    }, 300);
  }

  function addTag(tagName: string) {
    const trimmed = tagName.trim().toLowerCase();
    if (!trimmed || trimmed.length > 100 || localTags.includes(trimmed)) return;
    const newTags = [...localTags, trimmed];
    setLocalTags(newTags);
    flushTags(newTags);
    setTagInput('');
    setShowSuggestions(false);
  }

  function removeTag(tagName: string) {
    const newTags = localTags.filter((t) => t !== tagName);
    setLocalTags(newTags);
    flushTags(newTags);
  }

  const suggestions = existingTags?.filter(
    (t) => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !localTags.includes(t.name),
  ) ?? [];

  const isEmpty = localTags.length === 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 transition-colors',
          isEmpty
            ? 'border border-dashed border-border bg-transparent focus-within:border-indigo-400 focus-within:bg-background'
            : 'border border-input bg-background',
        )}
      >
        {localTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive" aria-label={`Remove tag ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(e.target.value.length > 0); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => { if (tagInput.length > 0) setShowSuggestions(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
            if (e.key === 'Escape') setShowSuggestions(false);
          }}
          placeholder={isEmpty ? 'Type a tag and press Enter' : ''}
          aria-label="Add tag"
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm shadow-none outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          style={{ outline: 'none', boxShadow: 'none' }}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="border border-border rounded-md bg-background shadow-md max-h-32 overflow-y-auto">
          {suggestions.slice(0, 8).map((tag) => (
            <button key={tag.name} type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(tag.name)}
            >{tag.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TaskDetailPanel ─────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onTagClick?: (tagName: string) => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showAgentNotes, setShowAgentNotes] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { mutate: archiveMutate } = useArchiveTask();
  const { mutate: restoreMutate } = useRestoreTask();
  const { mutate: deleteMutate } = useDeleteTask();

  useEffect(() => {
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    <div role="complementary" aria-label="Task detail" className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-border shrink-0">
        <StatusTransitionBar task={task} />
        <div className="flex items-center gap-1">
          {task.status === 'closed' && (
            <Button size="sm" variant="outline" onClick={() =>
              archiveMutate(task.id, { onSuccess: () => showSuccess('Archived'), onError: () => showError('Failed') })
            }>Archive</Button>
          )}
          {task.status === 'archived' && (
            <Button size="sm" variant="outline" onClick={() =>
              restoreMutate(task.id, { onSuccess: () => showSuccess('Restored'), onError: () => showError('Failed') })
            }>Restore</Button>
          )}
          {task.status !== 'pending_deletion' && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}>Delete</Button>
          )}
          <button ref={closeButtonRef} onClick={onClose} aria-label="Close task detail"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Agent Attribution */}
      <AgentAttributionBar task={task} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-4">

          {/* Confirmation bar */}
          <ConfirmationActionBar task={task} onClose={onClose} />

          {/* Header group — title + structured metadata live together */}
          <div className="flex flex-col gap-4">
            <InlineEditableTitle task={task} />
            <MetaCard task={task} />
          </div>

          {/* Description */}
          <div>
            <SectionHeader>Description</SectionHeader>
            <DescriptionEditor task={task} />
          </div>

          {/* Tags */}
          <div>
            <SectionHeader>Tags</SectionHeader>
            <TagsEditor task={task} />
          </div>

          {/* Subtasks */}
          <div>
            <SectionHeader>Subtasks</SectionHeader>
            <SubtaskPanel taskId={task.id} />
          </div>

          {/* Agent Notes */}
          {task.agentNotes && (
            <div>
              <button
                onClick={() => setShowAgentNotes((v) => !v)}
                aria-expanded={showAgentNotes}
                className="group mb-2 flex w-full items-center gap-3"
              >
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-teal-500" />
                <span className="shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">
                  Agent Notes
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent"
                />
                <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {showAgentNotes ? '▾' : '▸'}
                </span>
              </button>
              {showAgentNotes && (
                <div className="whitespace-pre-wrap rounded bg-muted/30 p-3 font-mono text-sm text-muted-foreground opacity-60">
                  {task.agentNotes}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <SectionHeader>Comments</SectionHeader>
            <CommentsSection taskId={task.id} />
          </div>

          {/* History */}
          <div>
            <SectionHeader>Activity</SectionHeader>
            <HistorySection taskId={task.id} />
          </div>

        </div>
      </div>
    </div>

    <CloseTaskDialog taskId={task.id} open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen} />

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>This task will be soft-deleted and permanently purged after one year.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteMutate(task.id, {
              onSuccess: () => { setIsDeleteDialogOpen(false); onClose(); showSuccess('Task deleted'); },
              onError: () => showError('Failed to delete task'),
            })}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
