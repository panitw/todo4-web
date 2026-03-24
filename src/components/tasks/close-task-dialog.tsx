'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCloseTask } from '@/hooks/use-close-task';

interface CloseTaskDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseTaskDialog({ taskId, open, onOpenChange }: CloseTaskDialogProps) {
  const [completionNote, setCompletionNote] = useState('');
  const [forceRequired, setForceRequired] = useState(false);
  const { mutate, isPending } = useCloseTask();

  function handleConfirm(force?: boolean) {
    mutate(
      { id: taskId, completionNote: completionNote.trim() || undefined, force },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCompletionNote('');
          setForceRequired(false);
          toast.success('Task closed');
        },
        onError: (err: unknown) => {
          const code = (err as { code?: string })?.code;
          const message = (err as { message?: string })?.message ?? '';
          if (code === 'incomplete_subtasks' || message.includes('incomplete_subtasks')) {
            setForceRequired(true);
          } else {
            toast.error('Failed to close task');
          }
        },
      },
    );
  }

  function handleClose() {
    onOpenChange(false);
    setForceRequired(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close task</DialogTitle>
          <DialogDescription>
            {forceRequired
              ? 'This task has incomplete subtasks. Close anyway?'
              : 'Optionally add a completion note.'}
          </DialogDescription>
        </DialogHeader>
        {!forceRequired && (
          <Textarea
            placeholder="Completion note (optional)"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            rows={3}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          {forceRequired ? (
            <Button variant="destructive" onClick={() => handleConfirm(true)} disabled={isPending}>
              {isPending ? 'Closing…' : 'Close anyway'}
            </Button>
          ) : (
            <Button onClick={() => handleConfirm()} disabled={isPending}>
              {isPending ? 'Closing…' : 'Close task'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
