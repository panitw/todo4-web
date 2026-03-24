'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { type Task, type TaskHistory, type TaskComment } from '@/lib/api/tasks';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useTaskHistory } from '@/hooks/use-task-history';
import { useTaskComments } from '@/hooks/use-task-comments';
import { useCreateComment } from '@/hooks/use-create-comment';
import { useArchiveTask } from '@/hooks/use-archive-task';
import { useRestoreTask } from '@/hooks/use-restore-task';
import { useDeleteTask } from '@/hooks/use-delete-task';
import { CloseTaskDialog } from './close-task-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Task['status'] }) {
  const label = status.replace(/_/g, ' ');
  return <Badge variant="outline">{label}</Badge>;
}

// ─── Inline Editable Title ───────────────────────────────────────────────────

function InlineEditableTitle({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(task.title);
  const { mutate, isPending } = useUpdateTask();
  const saveTriggeredRef = useRef(false);

  React.useEffect(() => {
    if (!isEditing) {
      setLocalTitle(task.title);
    }
  }, [task.title, isEditing]);

  function handleSave() {
    if (saveTriggeredRef.current) return;
    saveTriggeredRef.current = true;
    const trimmed = localTitle.trim();
    if (trimmed === task.title || !trimmed) {
      setLocalTitle(task.title);
      setIsEditing(false);
      saveTriggeredRef.current = false;
      return;
    }
    mutate(
      { id: task.id, data: { title: trimmed } },
      {
        onError: () => {
          setLocalTitle(task.title);
          toast.error('Failed to update title');
        },
        onSettled: () => {
          setIsEditing(false);
          saveTriggeredRef.current = false;
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setLocalTitle(task.title);
      setIsEditing(false);
    }
  }

  if (!isEditing) {
    return (
      <h1
        className="flex-1 text-lg font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
        onClick={() => setIsEditing(true)}
      >
        {localTitle}
      </h1>
    );
  }

  return (
    <Input
      autoFocus
      value={localTitle}
      disabled={isPending}
      onChange={(e) => setLocalTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="flex-1 text-lg font-semibold h-auto py-0.5"
    />
  );
}

// ─── Priority Selector ───────────────────────────────────────────────────────

function PrioritySelector({ task }: { task: Task }) {
  const { mutate, isPending } = useUpdateTask();

  return (
    <Select
      value={task.priority}
      disabled={isPending}
      onValueChange={(value) => {
        mutate(
          { id: task.id, data: { priority: value as Task['priority'] } },
          { onError: () => toast.error('Failed to update priority') },
        );
      }}
    >
      <SelectTrigger className="w-20 h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="p1">P1</SelectItem>
        <SelectItem value="p2">P2</SelectItem>
        <SelectItem value="p3">P3</SelectItem>
        <SelectItem value="p4">P4</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Due Date Picker ─────────────────────────────────────────────────────────

function DueDatePicker({ task }: { task: Task }) {
  const { mutate } = useUpdateTask();
  const [localDate, setLocalDate] = useState(
    task.dueDate ? task.dueDate.substring(0, 10) : '',
  );

  React.useEffect(() => {
    setLocalDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
  }, [task.dueDate]);

  return (
    <Input
      type="date"
      value={localDate}
      className="w-36 h-7 text-xs"
      onChange={(e) => setLocalDate(e.target.value)}
      onBlur={() => {
        mutate(
          { id: task.id, data: { dueDate: localDate || null } },
          { onError: () => toast.error('Failed to update due date') },
        );
      }}
    />
  );
}

// ─── Description Editor ──────────────────────────────────────────────────────

function DescriptionEditor({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDesc, setLocalDesc] = useState(task.description ?? '');
  const { mutate } = useUpdateTask();

  React.useEffect(() => {
    if (!isEditing) {
      setLocalDesc(task.description ?? '');
    }
  }, [task.description, isEditing]);

  function handleSave() {
    if (localDesc === (task.description ?? '')) {
      setIsEditing(false);
      return;
    }
    mutate(
      { id: task.id, data: { description: localDesc } },
      {
        onError: () => {
          setLocalDesc(task.description ?? '');
          toast.error('Failed to update description');
        },
        onSettled: () => setIsEditing(false),
      },
    );
  }

  if (!isEditing) {
    return (
      <div
        className="min-h-[60px] rounded px-2 py-1.5 cursor-pointer hover:bg-muted/50 text-sm whitespace-pre-wrap"
        onClick={() => setIsEditing(true)}
      >
        {task.description ?? (
          <span className="text-muted-foreground italic">
            Click to add description…
          </span>
        )}
      </div>
    );
  }

  return (
    <Textarea
      autoFocus
      value={localDesc}
      onChange={(e) => setLocalDesc(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setLocalDesc(task.description ?? '');
          setIsEditing(false);
        }
      }}
      className="min-h-[80px] text-sm"
    />
  );
}

// ─── Agent Notes Tab ──────────────────────────────────────────────────────────

function AgentNotesTab({ task }: { task: Task }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const regionId = `agent-notes-content-${task.id}`;

  return (
    <div>
      <button
        aria-expanded={isRevealed}
        aria-controls={regionId}
        onClick={() => setIsRevealed((prev) => !prev)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isRevealed ? 'Hide agent notes' : 'Reveal agent notes'}
      </button>
      {isRevealed && (
        <div
          id={regionId}
          className="mt-2 opacity-60 bg-muted/30 p-3 rounded text-sm font-mono whitespace-pre-wrap"
        >
          {task.agentNotes ?? 'No agent notes'}
        </div>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: TaskHistory }) {
  const details = entry.details as
    | { field?: string; oldValue?: unknown; newValue?: unknown }
    | null;
  const timestamp = new Date(entry.createdAt).toLocaleString();

  return (
    <div className="text-xs py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{timestamp}</span>
      {' · '}
      <span className="font-medium">{entry.actorType}</span>
      <span className="font-mono text-xs">{entry.actorId.slice(0, 8)}</span>
      {' · '}
      <span>{entry.action}</span>
      {details?.field && (
        <span className="text-muted-foreground">
          {' '}→ {details.field}:{' '}
          <span className="line-through">{String(details.oldValue ?? '')}</span>
          {' → '}
          <span>{String(details.newValue ?? '')}</span>
        </span>
      )}
    </div>
  );
}

function HistoryTab({ taskId }: { taskId: string }) {
  const { data: history, isPending } = useTaskHistory(taskId);

  if (isPending) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-muted rounded w-full" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No history yet</p>
    );
  }

  return (
    <div>
      {history.map((entry) => (
        <HistoryEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

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

function CommentsTab({ taskId }: { taskId: string }) {
  const { data: comments, isPending } = useTaskComments(taskId);
  const { mutate: addComment, isPending: isSubmitting } =
    useCreateComment(taskId);
  const [body, setBody] = useState('');

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    addComment(trimmed, {
      onSuccess: () => setBody(''),
      onError: () => toast.error('Failed to add comment'),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {isPending ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      ) : !comments || comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet — be the first to comment
        </p>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <Textarea
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="text-sm min-h-[64px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <Button
          size="sm"
          disabled={isSubmitting || !body.trim()}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Posting…' : 'Post comment'}
        </Button>
      </div>
    </div>
  );
}

// ─── TaskDetailPanel ─────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: archiveMutate } = useArchiveTask();
  const { mutate: restoreMutate } = useRestoreTask();
  const { mutate: deleteMutate } = useDeleteTask();

  return (
    <>
    <div
      role="complementary"
      aria-label="Task detail"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start gap-2 flex-wrap">
        <InlineEditableTitle task={task} />
        <StatusBadge status={task.status} />
        {/* Action buttons — shown based on task status */}
        {task.status !== 'closed' && task.status !== 'archived' && (
          <Button size="sm" variant="outline" onClick={() => setIsCloseDialogOpen(true)}>
            Close task
          </Button>
        )}
        {task.status === 'closed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              archiveMutate(task.id, {
                onSuccess: () => toast.success('Task archived'),
                onError: () => toast.error('Failed to archive task'),
              })
            }
          >
            Archive
          </Button>
        )}
        {task.status === 'archived' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              restoreMutate(task.id, {
                onSuccess: () => toast.success('Task restored'),
                onError: () => toast.error('Failed to restore task'),
              })
            }
          >
            Restore
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          Delete
        </Button>
        <button
          onClick={onClose}
          aria-label="Close task detail"
          className="shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none ml-1"
        >
          ×
        </button>
      </div>

      {/* Metadata row */}
      <div className="px-4 py-2 flex items-center gap-3 border-b border-border flex-wrap">
        <PrioritySelector task={task} />
        <DueDatePicker task={task} />
        {task.tags?.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {task.assignedAgentId && (
          <span className="text-xs text-muted-foreground">
            Agent: <span className="font-mono">{task.assignedAgentId}</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        className="flex-1 overflow-hidden flex flex-col"
      >
        <TabsList className="px-4 justify-start h-auto py-0 bg-transparent border-b border-border rounded-none">
          <TabsTrigger value="overview" className="text-xs py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="subtasks" className="text-xs py-2">
            Subtasks
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs py-2">
            History
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs py-2">
            Comments
          </TabsTrigger>
          <TabsTrigger value="agent-notes" className="text-xs py-2">
            Agent Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <DescriptionEditor task={task} />
          {task.referenceUrl && (
            <a
              href={task.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-xs text-blue-500 hover:underline break-all"
            >
              {task.referenceUrl}
            </a>
          )}
        </TabsContent>

        <TabsContent
          value="subtasks"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <p className="text-sm text-muted-foreground">Subtasks coming soon</p>
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <HistoryTab taskId={task.id} />
        </TabsContent>

        <TabsContent
          value="comments"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <CommentsTab taskId={task.id} />
        </TabsContent>

        <TabsContent
          value="agent-notes"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <AgentNotesTab task={task} />
        </TabsContent>
      </Tabs>
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
                  onClose();
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
