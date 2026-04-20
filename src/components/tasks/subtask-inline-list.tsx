'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { showError } from '@/lib/toast';
import { useSubtasks } from '@/hooks/use-subtasks';
import { useUpdateSubtask } from '@/hooks/use-update-subtask';

export function SubtaskInlineList({
  taskId,
  readOnly = false,
}: {
  taskId: string;
  readOnly?: boolean;
}) {
  const { data, isLoading, isError } = useSubtasks(taskId);
  const { mutate } = useUpdateSubtask(taskId);

  if (isLoading) {
    return (
      <p className="text-[0.8125rem] text-muted-foreground py-1">
        Loading subtasks…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-[0.8125rem] text-destructive py-1">
        Failed to load subtasks.
      </p>
    );
  }

  const subtasks = data ?? [];
  if (subtasks.length === 0) {
    return (
      <p className="text-[0.8125rem] text-muted-foreground py-1">
        No subtasks.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {subtasks.map((subtask) => (
        <li
          key={subtask.id}
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={`inline-subtask-${subtask.id}`}
            checked={subtask.completed}
            disabled={readOnly}
            onCheckedChange={(checked) => {
              mutate(
                { subtaskId: subtask.id, data: { completed: !!checked } },
                { onError: () => showError('Failed to update subtask') },
              );
            }}
          />
          <label
            htmlFor={`inline-subtask-${subtask.id}`}
            className={`flex-1 min-w-0 text-[0.8125rem] select-none ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
          >
            {subtask.title}
          </label>
        </li>
      ))}
    </ul>
  );
}
