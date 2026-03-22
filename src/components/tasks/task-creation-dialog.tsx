'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useCreateTask } from '@/hooks/use-create-task';
import type { CreateTaskInput } from '@/lib/api/tasks';

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (taskId: string) => void;
}

interface FormState {
  title: string;
  description: string;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  dueDate: string;
  tags: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  referenceUrl: string;
}

const defaultForm: FormState = {
  title: '',
  description: '',
  priority: 'p4',
  dueDate: '',
  tags: '',
  recurrence: 'none',
  referenceUrl: '',
};

export function TaskCreationDialog({
  open,
  onOpenChange,
  onTaskCreated,
}: TaskCreationDialogProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [titleError, setTitleError] = useState<string | null>(null);
  const { mutate, isPending, error } = useCreateTask();

  function handleChange(field: keyof FormState, value: string | null) {
    if (value === null) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(defaultForm);
    setTitleError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Title is required.');
      return;
    }
    setTitleError(null);

    const parsedTags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const input: CreateTaskInput = {
      title: form.title.trim(),
    };
    if (form.description.trim()) input.description = form.description.trim();
    if (form.priority !== 'p4') input.priority = form.priority;
    if (form.dueDate) input.dueDate = form.dueDate;
    if (parsedTags.length > 0) input.tags = parsedTags;
    if (form.recurrence !== 'none') input.recurrence = form.recurrence;
    if (form.referenceUrl.trim()) input.referenceUrl = form.referenceUrl.trim();

    mutate(input, {
      onSuccess: (task) => {
        onTaskCreated?.(task.id);
        onOpenChange(false);
        resetForm();
      },
    });
  }

  function handleCancel() {
    onOpenChange(false);
    resetForm();
  }

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;
  const titleTooLong = form.title.length > 500;
  const titleEmpty = form.title.trim().length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Task title"
              maxLength={500}
              required
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
            {titleTooLong && (
              <p className="text-xs text-destructive">
                Title must not exceed 500 characters ({form.title.length}/500)
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Priority and Recurrence row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(v) => handleChange('priority', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">P1 — Urgent</SelectItem>
                  <SelectItem value="p2">P2 — High</SelectItem>
                  <SelectItem value="p3">P3 — Medium</SelectItem>
                  <SelectItem value="p4">P4 — Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Recurrence</label>
              <Select
                value={form.recurrence}
                onValueChange={(v) => handleChange('recurrence', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="task-due-date"
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="task-tags"
              value={form.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="e.g. project:alpha, urgent"
            />
          </div>

          {/* Reference URL */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-ref-url" className="text-sm font-medium">
              Reference URL
            </label>
            <Input
              id="task-ref-url"
              type="url"
              value={form.referenceUrl}
              onChange={(e) => handleChange('referenceUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || titleTooLong || titleEmpty}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
