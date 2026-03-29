'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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

// ─── Constants ──────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  p1: 'Critical', p2: 'High', p3: 'Medium', p4: 'Low',
};

const PRIORITY_COLORS: Record<string, string> = {
  p1: 'text-red-600', p2: 'text-orange-500', p3: 'text-blue-500', p4: 'text-gray-400',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'To Do' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  closed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
  waiting_for_human: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Waiting' },
  pending_deletion: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Delete' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocked' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Archived' },
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-[13px] font-semibold text-indigo-400 uppercase tracking-wide whitespace-nowrap shrink-0">{children}</h3>
      <span className="flex-1 h-px bg-indigo-200" aria-hidden="true" />
    </div>
  );
}

// ─── Status Badge (read-only, for non-editable states) ──────────────────────

function StatusBadge({ status }: { status: Task['status'] }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ─── Status Transition Button (JIRA-style) ─────────────────────────────────

interface StatusAction {
  label: string;
  targetStatus: string;
  style: string;
}

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  open: [
    { label: 'Start Working', targetStatus: 'in_progress', style: 'text-white hover:opacity-85 [background-image:linear-gradient(135deg,#7c3aed,#3b82f6)]' },
  ],
  in_progress: [
    { label: 'Done', targetStatus: 'closed', style: 'text-white hover:opacity-85 [background-image:linear-gradient(135deg,#7c3aed,#3b82f6)]' },
    { label: 'To Do', targetStatus: 'open', style: 'border border-border bg-background hover:bg-muted text-foreground' },
  ],
  closed: [
    { label: 'Reopen', targetStatus: 'open', style: 'border border-border bg-background hover:bg-muted text-foreground' },
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
        onError: () => toast.error('Failed to close task'),
      });
    } else {
      updateMutate({ id: task.id, data: { status: targetStatus as 'open' | 'in_progress' } }, {
        onError: () => toast.error('Failed to update status'),
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={task.status} />
      {actions.map((action) => (
        <button
          key={action.targetStatus}
          type="button"
          disabled={isPending}
          onClick={() => handleTransition(action.targetStatus)}
          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${action.style}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─── Agent Attribution Bar ──────────────────────────────────────────────────

function AgentAttributionBar({ task }: { task: Task }) {
  if (!task.assignedAgentId) return null;
  const date = new Date(task.createdAt).toLocaleDateString();
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-200 text-xs text-teal-800">
      <Bot className="h-3.5 w-3.5 shrink-0" />
      <span>Created by <span className="font-medium">{task.assignedAgentId}</span> &middot; {date}</span>
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
          onSuccess: () => toast.success('Task restored'),
          onError: () => toast.error('Failed to restore task'),
        })}
        className="border-red-300 text-red-700 hover:bg-red-50"
      >Reject</Button>
      <Button size="sm" disabled={isDeleting || isRestoring}
        onClick={() => deleteMutate(task.id, {
          onSuccess: () => { onClose(); toast.success('Task deleted'); },
          onError: () => toast.error('Failed to delete task'),
        })}
      >Approve</Button>
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
    if (!trimmed) { setError('Title is required'); setLocalTitle(task.title); setIsEditing(false); saveTriggeredRef.current = false; return; }
    if (trimmed.length > 500) { setError('Max 500 characters'); saveTriggeredRef.current = false; return; }
    setError(null);
    if (trimmed === task.title) { setIsEditing(false); saveTriggeredRef.current = false; return; }
    mutate({ id: task.id, data: { title: trimmed } }, {
      onError: () => { setLocalTitle(task.title); toast.error('Failed to update title'); },
      onSettled: () => { setIsEditing(false); saveTriggeredRef.current = false; },
    });
  }

  if (!isEditing) {
    return (
      <h2 className="text-base font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 leading-snug"
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
        maxLength={500} className="text-base font-semibold h-auto py-0.5" aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Description Editor ──────────────────────────────────────────────────────

function DescriptionEditor({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDesc, setLocalDesc] = useState(task.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useUpdateTask();

  React.useEffect(() => { if (!isEditing) setLocalDesc(task.description ?? ''); }, [task.description, isEditing]);

  function handleSave() {
    if (localDesc.length > 10000) { setError('Max 10,000 characters'); return; }
    setError(null);
    if (localDesc === (task.description ?? '')) { setIsEditing(false); return; }
    mutate({ id: task.id, data: { description: localDesc } }, {
      onError: () => { setLocalDesc(task.description ?? ''); toast.error('Failed to update description'); },
      onSettled: () => setIsEditing(false),
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
        maxLength={10000} className="min-h-[80px] text-sm" aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── History Entry ───────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: TaskHistory }) {
  const details = entry.details as { field?: string; oldValue?: unknown; newValue?: unknown; reasoning?: string } | null;
  const timestamp = new Date(entry.createdAt).toLocaleString();

  return (
    <div className="text-xs py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{timestamp}</span>
      {' · '}<span className="font-medium">{entry.actorType}</span>
      {' '}<span className="font-mono">{entry.actorId.slice(0, 8)}</span>
      {' · '}<span>{entry.action}</span>
      {details?.field && (
        <span className="text-muted-foreground">
          {' → '}{details.field}: <span className="line-through">{String(details.oldValue ?? '')}</span>
          {' → '}{String(details.newValue ?? '')}
        </span>
      )}
      {details?.reasoning && <p className="mt-0.5 text-muted-foreground italic">Reasoning: {details.reasoning}</p>}
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
    addComment(trimmed, { onSuccess: () => setBody(''), onError: () => toast.error('Failed to add comment') });
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
        />
        <Button size="sm" disabled={isSubmitting || !body.trim()} onClick={handleSubmit}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}

// ─── Tags Editor ─────────────────────────────────────────────────────────────

function TagsEditor({ task }: { task: Task }) {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { mutate } = useUpdateTask();
  const { data: existingTags } = useTags();

  const tags = task.tags ?? [];

  function addTag(tagName: string) {
    const trimmed = tagName.trim();
    if (!trimmed || trimmed.length > 100 || tags.includes(trimmed)) return;
    mutate({ id: task.id, data: { tags: [...tags, trimmed] } }, {
      onError: () => toast.error('Failed to update tags'),
    });
    setTagInput('');
    setShowSuggestions(false);
  }

  function removeTag(tagName: string) {
    mutate({ id: task.id, data: { tags: tags.filter((t) => t !== tagName) } }, {
      onError: () => toast.error('Failed to update tags'),
    });
  }

  const suggestions = existingTags?.filter(
    (t) => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t.name),
  ) ?? [];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 min-h-[36px] focus-within:border-ring">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1">
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
            if (e.key === 'Backspace' && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1]);
            if (e.key === 'Escape') setShowSuggestions(false);
          }}
          placeholder={tags.length === 0 ? 'Type to add tags...' : ''}
          className="flex-1 min-w-[100px] bg-transparent text-sm outline-none border-none shadow-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground"
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
  const { mutate: updateMutate, isPending: isPriorityPending } = useUpdateTask();

  useEffect(() => {
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    <div role="complementary" aria-label="Task detail" className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <StatusTransitionBar task={task} />
        <div className="flex items-center gap-1">
          {task.status === 'closed' && (
            <Button size="sm" variant="outline" onClick={() =>
              archiveMutate(task.id, { onSuccess: () => toast.success('Archived'), onError: () => toast.error('Failed') })
            }>Archive</Button>
          )}
          {task.status === 'archived' && (
            <Button size="sm" variant="outline" onClick={() =>
              restoreMutate(task.id, { onSuccess: () => toast.success('Restored'), onError: () => toast.error('Failed') })
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
        <div className="flex flex-col gap-5 p-4">

          {/* Confirmation bar */}
          <ConfirmationActionBar task={task} onClose={onClose} />

          {/* Title */}
          <InlineEditableTitle task={task} />

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={task.priority} disabled={isPriorityPending}
              onValueChange={(v) => updateMutate({ id: task.id, data: { priority: v as Task['priority'] } },
                { onError: () => toast.error('Failed to update priority') })}
            >
              <SelectTrigger className="w-auto h-7 text-xs">
                <span className={PRIORITY_COLORS[task.priority]}>&#9679;</span>
                <span>{PRIORITY_LABELS[task.priority]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p1"><span className="text-red-600">&#9679;</span> Critical</SelectItem>
                <SelectItem value="p2"><span className="text-orange-500">&#9679;</span> High</SelectItem>
                <SelectItem value="p3"><span className="text-blue-500">&#9679;</span> Medium</SelectItem>
                <SelectItem value="p4"><span className="text-gray-400">&#9679;</span> Low</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date"
              defaultValue={task.dueDate ? task.dueDate.substring(0, 10) : ''}
              className="w-36 h-7 text-xs"
              onBlur={(e) => updateMutate({ id: task.id, data: { dueDate: e.target.value || null } },
                { onError: () => toast.error('Failed to update due date') })}
            />
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
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
              >
                Agent Notes {showAgentNotes ? '▾' : '▸'}
              </button>
              {showAgentNotes && (
                <div className="opacity-60 bg-muted/30 p-3 rounded text-sm font-mono whitespace-pre-wrap text-muted-foreground">
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
              onSuccess: () => { setIsDeleteDialogOpen(false); onClose(); toast.success('Task deleted'); },
              onError: () => toast.error('Failed to delete task'),
            })}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
