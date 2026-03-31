'use client';

import React, { useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/use-create-task';

interface QuickAddBarProps {
  onTaskCreated?: (taskId: string) => void;
}

export function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending, error } = useCreateTask();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim() ?? '';
      if (!value || isPending) return;
      // Clear input immediately (optimistic)
      if (inputRef.current) inputRef.current.value = '';
      mutate(
        { title: value },
        {
          onSuccess: (task) => {
            onTaskCreated?.(task.id);
          },
          onError: () => {
            // Restore the title so the user can retry
            if (inputRef.current) inputRef.current.value = value;
          },
        },
      );
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  }

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <div>
      <div className="flex items-center gap-2">
        {isPending ? (
          <Loader2 className="w-4 h-4 shrink-0 text-muted-foreground animate-spin" />
        ) : (
          <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          onKeyDown={handleKeyDown}
          disabled={isPending}
        />
        <span className="text-xs text-muted-foreground hidden sm:inline select-none">
          Enter
        </span>
      </div>
      {errorMessage && (
        <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
