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
  const { mutate, isPending } = useCloseTask();

  function handleConfirm() {
    mutate(
      { id: taskId, completionNote: completionNote.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCompletionNote('');
          toast.success('Task closed');
        },
        onError: () => toast.error('Failed to close task'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close task</DialogTitle>
          <DialogDescription>Optionally add a completion note.</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Completion note (optional)"
          value={completionNote}
          onChange={(e) => setCompletionNote(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Closing…' : 'Close task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
