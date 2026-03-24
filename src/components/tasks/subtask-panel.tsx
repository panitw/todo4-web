'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubtasks } from '@/hooks/use-subtasks';
import { useCreateSubtask } from '@/hooks/use-create-subtask';
import { useUpdateSubtask } from '@/hooks/use-update-subtask';
import { useDeleteSubtask } from '@/hooks/use-delete-subtask';
import type { Subtask } from '@/lib/api/tasks';

function SortableSubtaskItem({
  subtask,
  onToggle,
  onDelete,
}: {
  subtask: Subtask;
  onToggle: (subtaskId: string, completed: boolean) => void;
  onDelete: (subtaskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 py-1.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        id={`subtask-${subtask.id}`}
        checked={subtask.completed}
        onCheckedChange={(checked) => onToggle(subtask.id, checked as boolean)}
      />
      <label
        htmlFor={`subtask-${subtask.id}`}
        className={`flex-1 text-sm cursor-pointer select-none ${
          subtask.completed ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {subtask.title}
      </label>
      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        aria-label="Delete subtask"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function SubtaskPanel({ taskId }: { taskId: string }) {
  const [newTitle, setNewTitle] = useState('');
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const { mutate: createMutate, isPending: isCreating } = useCreateSubtask(taskId);
  const { mutate: updateMutate } = useUpdateSubtask(taskId);
  const { mutate: deleteMutate } = useDeleteSubtask(taskId);

  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    createMutate(title, {
      onSuccess: () => {
        setNewTitle('');
        inputRef.current?.focus();
      },
      onError: () => toast.error('Failed to add subtask'),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleToggle(subtaskId: string, completed: boolean) {
    updateMutate(
      { subtaskId, data: { completed } },
      { onError: () => toast.error('Failed to update subtask') },
    );
  }

  function handleDelete(subtaskId: string) {
    deleteMutate(subtaskId, {
      onError: () => toast.error('Failed to delete subtask'),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSubtasks.findIndex((s) => s.id === active.id);
    const newIndex = localSubtasks.findIndex((s) => s.id === over.id);
    setLocalSubtasks(arrayMove(localSubtasks, oldIndex, newIndex));

    updateMutate(
      { subtaskId: active.id as string, data: { sortOrder: newIndex } },
      { onError: () => toast.error('Failed to reorder subtasks') },
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading subtasks…</p>;
  }

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localSubtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {localSubtasks.map((subtask) => (
            <SortableSubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {localSubtasks.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          No subtasks yet. Add one below.
        </p>
      )}

      {/* Add subtask input */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          ref={inputRef}
          placeholder="Add a subtask…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          disabled={isCreating}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isCreating || !newTitle.trim()}
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add subtask</span>
        </Button>
      </div>
    </div>
  );
}
