'use client';

import React, { useState, useRef } from 'react';
import { AlertCircle, HelpCircle, Bot, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api/tasks';
import { useDeleteTask } from '@/hooks/use-delete-task';
import { useRestoreTask } from '@/hooks/use-restore-task';
import { useCreateComment } from '@/hooks/use-create-comment';
import { useUpdateTask } from '@/hooks/use-update-task';

// --- Sub-components ---

function AgentStatusPip({ agentName }: { agentName: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-teal-700">
      <Bot className="h-3 w-3" aria-hidden="true" />
      <span>{agentName}</span>
    </span>
  );
}

// --- AttentionCard ---

export interface AttentionCardProps {
  task: Task;
  onSelectTask: (id: string) => void;
  disabled?: boolean;
}

export function AttentionCard({ task, onSelectTask, disabled }: AttentionCardProps) {
  const isConfirmation = task.status === 'pending_deletion';
  const isWaiting = task.status === 'waiting_for_human';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [answer, setAnswer] = useState('');
  const submittedRef = useRef(false);

  const { mutate: deleteMutate, isPending: isApproving } = useDeleteTask();
  const { mutate: restoreMutate, isPending: isRejecting } = useRestoreTask();
  const { mutate: commentMutate, isPending: isCommenting } = useCreateComment(task.id);
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateTask();

  const isAnswering = isCommenting || isUpdating;
  const isLoading = isApproving || isRejecting || isAnswering || !!disabled;

  // --- Confirmation actions ---

  function handleApprove() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    deleteMutate(task.id, {
      onSuccess: () => {
        setIsCollapsed(true);
        showSuccess('Task deleted');
      },
      onError: () => {
        submittedRef.current = false;
        showError('Failed to delete task.', {
          duration: Infinity,
          action: { label: 'Retry', onClick: handleApprove },
        });
      },
    });
  }

  function handleRejectSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Post reject reason as comment if provided, then restore
    const reason = rejectReason.trim();
    const doRestore = () => {
      restoreMutate(task.id, {
        onSuccess: () => {
          setIsCollapsed(true);
          showSuccess('Task restored');
        },
        onError: () => {
          submittedRef.current = false;
          showError('Failed to restore task.', {
            duration: Infinity,
            action: { label: 'Retry', onClick: handleRejectSubmit },
          });
        },
      });
    };

    if (reason) {
      commentMutate(`Rejection reason: ${reason}`, {
        onSuccess: doRestore,
        onError: () => {
          submittedRef.current = false;
          showError('Failed to post rejection reason.', {
            duration: Infinity,
            action: { label: 'Retry', onClick: handleRejectSubmit },
          });
        },
      });
    } else {
      doRestore();
    }
  }

  // --- Waiting-for-human actions ---

  function handleAnswerSubmit() {
    if (!answer.trim() || submittedRef.current) return;
    submittedRef.current = true;

    // Update status first (recoverable), then post comment
    updateMutate(
      { id: task.id, data: { status: 'in_progress' } },
      {
        onSuccess: () => {
          commentMutate(answer.trim(), {
            onSuccess: () => {
              setIsCollapsed(true);
              showSuccess('Answer sent — task resumed');
            },
            onError: () => {
              // Status updated but comment failed — card still collapses since task resumed
              setIsCollapsed(true);
              showError('Task resumed, but failed to post your answer as a comment.');
            },
          });
        },
        onError: () => {
          submittedRef.current = false;
          showError('Failed to resume task.', {
            duration: Infinity,
            action: { label: 'Retry', onClick: handleAnswerSubmit },
          });
        },
      },
    );
  }

  // Agent reasoning / question text
  const secondaryText = task.agentNotes || (isConfirmation ? 'Agent requested this action' : 'Agent needs your input');

  if (isCollapsed) return null;

  return (
    <div
      className={cn(
        'rounded-lg border shadow-sm p-3 md:p-4 border-l-4',
        'motion-safe:transition-opacity motion-safe:duration-[120ms] motion-safe:ease-out',
        isConfirmation && 'bg-orange-50 border-l-orange-300',
        isWaiting && 'bg-blue-50 border-l-blue-300',
        isLoading && 'opacity-60',
      )}
    >
      {/* Header row: icon + title + agent pip */}
      <div className="flex items-start gap-2.5">
        {isConfirmation ? (
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[15px] font-medium text-foreground hover:underline truncate text-left"
              onClick={() => onSelectTask(task.id)}
            >
              {task.title}
            </button>
            <AgentStatusPip agentName="Agent" />
          </div>

          {/* Agent reasoning / question */}
          <p className="text-[14px] italic text-muted-foreground mt-1">
            {secondaryText}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 ml-7">
        {isConfirmation && !showRejectReason && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              disabled={isLoading}
              onClick={handleApprove}
              aria-label={`Approve deletion of ${task.title}`}
            >
              {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={isLoading}
              onClick={() => setShowRejectReason(true)}
              aria-label={`Reject deletion of ${task.title}`}
              aria-expanded={showRejectReason}
            >
              {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reject'}
            </Button>
          </div>
        )}

        {isConfirmation && showRejectReason && (
          <div className="flex items-center gap-2" role="group" aria-label="Reject with reason">
            <Input
              type="text"
              placeholder="Reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRejectSubmit();
                if (e.key === 'Escape') setShowRejectReason(false);
              }}
              className="flex-1 text-sm h-8"
              autoFocus
            />
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={isLoading}
              onClick={handleRejectSubmit}
            >
              {isRejecting || isCommenting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reject'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowRejectReason(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        )}

        {isWaiting && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && answer.trim()) handleAnswerSubmit();
              }}
              className="flex-1 text-sm h-8"
              aria-label={`Your answer to ${task.title}`}
            />
            <Button
              size="sm"
              className="bg-teal-600 text-white hover:bg-teal-700"
              disabled={isLoading || !answer.trim()}
              onClick={handleAnswerSubmit}
            >
              {isAnswering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reply'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
