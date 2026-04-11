'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCreateTask } from '@/hooks/use-create-task';
import { useTags } from '@/hooks/use-tags';
import { SectionHeader, PRIORITY_LABELS, PRIORITY_COLORS } from './task-shared';
import type { CreateTaskInput } from '@/lib/api/tasks';

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (taskId: string) => void;
  /** Pre-fill the due date field (ISO date string like "2026-03-15") */
  defaultDueDate?: string;
}

interface FormState {
  title: string;
  description: string;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'open' | 'in_progress';
  dueDate: string;
  tagInput: string;
  tags: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  tagInput?: string;
}

const STATUS_CONFIG: Record<string, { dot: string; border: string; label: string }> = {
  open: { dot: 'bg-slate-300 border-slate-400', border: 'border-slate-400', label: 'To Do' },
  in_progress: { dot: 'bg-blue-500', border: 'border-transparent', label: 'In Progress' },
};

const defaultForm: FormState = {
  title: '',
  description: '',
  priority: 'p3',
  status: 'open',
  dueDate: '',
  tagInput: '',
  tags: [],
};

export function TaskCreationDialog({
  open,
  onOpenChange,
  onTaskCreated,
  defaultDueDate,
}: TaskCreationDialogProps) {
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultForm,
    dueDate: defaultDueDate ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const { mutate, isPending, error } = useCreateTask();
  const { data: existingTags } = useTags();
  const titleRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Adjust form state when dialog opens (React "adjust state during render" pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setForm({ ...defaultForm, dueDate: defaultDueDate ?? '' });
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => titleRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  function handleChange(field: 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'tagInput', value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (Object.prototype.hasOwnProperty.call(errors, field)) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateField(field: string, value: string): string | undefined {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.length > 500) return `Title must not exceed 500 characters (${value.length}/500)`;
        return undefined;
      case 'description':
        if (value.length > 10000) return `Description must not exceed 10,000 characters`;
        return undefined;
      case 'tagInput':
        if (value.length > 100) return 'Tag must not exceed 100 characters';
        return undefined;
      default:
        return undefined;
    }
  }

  function handleBlur(field: 'title' | 'description' | 'tagInput') {
    const fieldError = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  }

  function addTag(tagName: string) {
    const trimmed = tagName.trim().toLowerCase();
    if (!trimmed || trimmed.length > 100 || form.tags.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed], tagInput: '' }));
    setShowTagSuggestions(false);
  }

  function removeTag(tagName: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagName) }));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(form.tagInput); }
    if (e.key === 'Backspace' && !form.tagInput && form.tags.length > 0) setForm((prev) => ({ ...prev, tags: prev.tags.slice(0, -1) }));
    if (e.key === 'Escape') setShowTagSuggestions(false);
  }

  const tagSuggestions = existingTags?.filter(
    (t) => t.name.toLowerCase().includes(form.tagInput.toLowerCase()) && !form.tags.includes(t.name),
  ) ?? [];

  function resetForm() {
    setForm({ ...defaultForm, dueDate: defaultDueDate ?? '' });
    setErrors({});
    setShowTagSuggestions(false);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const titleError = validateField('title', form.title);
    const descError = validateField('description', form.description);
    if (titleError || descError) { setErrors({ title: titleError, description: descError }); return; }

    const input: CreateTaskInput = { title: form.title.trim() };
    if (form.description.trim()) input.description = form.description.trim();
    if (form.priority !== 'p3') input.priority = form.priority;
    if (form.status !== 'open') input.status = form.status;
    if (form.dueDate) input.dueDate = form.dueDate;
    if (form.tags.length > 0) input.tags = form.tags;

    mutate(input, {
      onSuccess: (task) => { onTaskCreated?.(task.id); onOpenChange(false); resetForm(); },
    });
  }

  function handleClose() {
    onOpenChange(false);
    resetForm();
    setTimeout(() => triggerRef.current?.focus(), 50);
  }

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;
  const isValid = form.title.trim().length > 0 && form.title.length <= 500 && !errors.title && !errors.description;
  const statusConfig = STATUS_CONFIG[form.status];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md lg:max-w-lg p-0 flex flex-col">

        {/* Top bar — matches detail panel */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">New Task</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
            <Button size="sm" variant="gradient" onClick={() => handleSubmit()} disabled={isPending || !isValid}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create
            </Button>
            <button onClick={handleClose} aria-label="Close"
              className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content — same structure as detail panel */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-4">

            {/* Title */}
            <div className="flex flex-col gap-0.5">
              <Input
                ref={titleRef}
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                placeholder="Task title"
                maxLength={500}
                className="text-base font-semibold h-auto py-1.5 border-none shadow-none px-1 focus-visible:border-none placeholder:text-muted-foreground/60"
                aria-label="Task title"
                aria-required="true"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'create-title-error' : undefined}
              />
              {errors.title && <p id="create-title-error" className="text-xs text-destructive px-1">{errors.title}</p>}
            </div>

            {/* Metadata row — matches detail panel */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={form.status} onValueChange={(v) => { if (v) handleChange('status', v); }}>
                <SelectTrigger className="w-auto h-7 text-xs" aria-label="Status">
                  <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.dot} border ${statusConfig.border}`} />
                  <span>{statusConfig.label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open"><span className="inline-block w-2 h-2 rounded-full bg-slate-300 border border-slate-400" /> To Do</SelectItem>
                  <SelectItem value="in_progress"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> In Progress</SelectItem>
                </SelectContent>
              </Select>

              <Select value={form.priority} onValueChange={(v) => { if (v) handleChange('priority', v); }}>
                <SelectTrigger className="w-auto h-7 text-xs" aria-label="Priority">
                  <span className={PRIORITY_COLORS[form.priority]}>&#9679;</span>
                  <span>{PRIORITY_LABELS[form.priority]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1"><span className="text-red-600">&#9679;</span> Critical</SelectItem>
                  <SelectItem value="p2"><span className="text-orange-700">&#9679;</span> High</SelectItem>
                  <SelectItem value="p3"><span className="text-blue-600">&#9679;</span> Medium</SelectItem>
                  <SelectItem value="p4"><span className="text-gray-400">&#9679;</span> Low</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-36 h-7 text-xs"
                aria-label="Due date"
              />
            </div>

            {/* Description */}
            <div>
              <SectionHeader>Description</SectionHeader>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                placeholder="Add a description..."
                rows={3}
                className="resize-none text-sm"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'create-desc-error' : undefined}
              />
              {errors.description && <p id="create-desc-error" className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>

            {/* Tags */}
            <div>
              <SectionHeader>Tags</SectionHeader>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 min-h-[40px] focus-within:border-ring">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive" aria-label={`Remove tag ${tag}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={form.tagInput}
                  onChange={(e) => { handleChange('tagInput', e.target.value); setShowTagSuggestions(e.target.value.length > 0); }}
                  onBlur={() => { handleBlur('tagInput'); setTimeout(() => setShowTagSuggestions(false), 200); }}
                  onFocus={() => { if (form.tagInput.length > 0) setShowTagSuggestions(true); }}
                  onKeyDown={handleTagKeyDown}
                  placeholder={form.tags.length === 0 ? 'Type to search or create tags...' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-none shadow-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  aria-invalid={!!errors.tagInput}
                  aria-describedby={errors.tagInput ? 'create-tag-error' : undefined}
                />
              </div>
              {errors.tagInput && <p id="create-tag-error" className="text-xs text-destructive mt-1">{errors.tagInput}</p>}
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="border border-border rounded-md bg-background shadow-md max-h-32 overflow-y-auto mt-1">
                  {tagSuggestions.slice(0, 8).map((tag) => (
                    <button key={tag.name} type="button"
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(tag.name)}
                    >{tag.name}</button>
                  ))}
                </div>
              )}
            </div>

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
