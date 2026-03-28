'use client';

import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { ListTodo, Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { CopyablePromptBlock } from '@/components/shared/copyable-prompt-block';
import { TaskRow } from '@/components/tasks/task-row';
import { FilterChipBar, DEFAULT_FILTERS, isNonDefault, type TaskFilters } from '@/components/tasks/filter-chip-bar';
import { QuickAddBar } from '@/components/tasks/quick-add-bar';
import { TaskCreationDialog } from '@/components/tasks/task-creation-dialog';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { BulkActionBar } from '@/components/tasks/bulk-action-bar';
import { useTasks } from '@/hooks/use-tasks';
import { useTags } from '@/hooks/use-tags';
import { useTask } from '@/hooks/use-task';
import { useUpdateTask } from '@/hooks/use-update-task';
import type { Task } from '@/lib/api/tasks';

const ONBOARDING_PROMPTS = [
  'Create a task called \'Review weekly goals\' with priority p2, due next Monday',
  'Add a task \'Research competitors\' with subtasks: check pricing, compare features, write summary',
  'Show me all my open tasks sorted by priority',
  'Create a recurring task \'Weekly team standup notes\' that repeats every Monday',
];

// Skeleton placeholder for loading state
function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 min-h-[48px] md:min-h-[36px] animate-pulse">
      <div className="w-4 h-4 rounded bg-muted shrink-0" />
      <div className="w-6 h-3 rounded bg-muted shrink-0" />
      <div className="flex-1 h-3 rounded bg-muted" />
    </div>
  );
}

// SortableTaskRow: wraps TaskRow with @dnd-kit useSortable for drag reorder
function SortableTaskRow({
  task,
  virtualStart,
  measureRef,
  dataIndex,
  ...taskRowProps
}: {
  task: Task;
  virtualStart: number;
  measureRef: (el: Element | null) => void;
  dataIndex: number;
} & Omit<React.ComponentProps<typeof TaskRow>, 'task' | 'dragHandleProps' | 'isDragging'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const y = isDragging ? virtualStart : virtualStart + (transform?.y ?? 0);

  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transform: `translate3d(0px, ${y}px, 0)`,
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        measureRef(el);
      }}
      data-index={dataIndex}
      style={style}
    >
      <TaskRow
        task={task}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        isDragging={isDragging}
        {...taskRowProps}
      />
    </div>
  );
}

function VirtualTaskList({
  tasks,
  selectedTaskId,
  highlightedTaskId,
  selectedBulkIds,
  onSelect,
  onBulkSelect,
  onTagClick,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  highlightedTaskId: string | null;
  selectedBulkIds: Set<string>;
  onSelect: (id: string) => void;
  onBulkSelect: (id: string, checked: boolean) => void;
  onTagClick?: (tagName: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    // Use 48px as the estimated row height (mobile default); Tailwind overrides to
    // 36px at md+. Over-estimating is safe — underestimating causes layout jumps.
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          style={{ height: virtualizer.getTotalSize() }}
          className="relative divide-y divide-border"
        >
          {virtualItems.map((virtualRow) => {
            const task = tasks[virtualRow.index];
            return (
              <SortableTaskRow
                key={task.id}
                task={task}
                virtualStart={virtualRow.start}
                measureRef={virtualizer.measureElement}
                dataIndex={virtualRow.index}
                selected={task.id === selectedTaskId}
                highlighted={task.id === highlightedTaskId}
                isBulkSelected={selectedBulkIds.has(task.id)}
                onSelect={onSelect}
                onBulkSelect={onBulkSelect}
                onTagClick={onTagClick}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    priority: ['p1', 'p2'], // default: show high-priority tasks (P1+P2)
    status: [],
    tags: [],
    dueAfter: '',
    dueBefore: '',
  });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [orderedTaskIds, setOrderedTaskIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { mutate: updateTaskMutate, isPending: isReorderPending } = useUpdateTask();

  function handleTaskCreated(taskId: string) {
    setNewTaskId(taskId);
    setTimeout(() => setNewTaskId(null), 1500);
  }

  const { data: availableTags } = useTags();

  const { data, isPending } = useTasks({
    priority: filters.priority,
    status: filters.status,
    tags: filters.tags,
    dueAfter: filters.dueAfter || undefined,
    dueBefore: filters.dueBefore || undefined,
  });

  const tasks = data?.data ?? [];

  // Keep local ordering in sync with server data (server is source of truth for new data)
  React.useEffect(() => {
    if (isReorderPending) return;
    setOrderedTaskIds(tasks.map((t) => t.id));
  }, [tasks, isReorderPending]);

  // Derive ordered task array from local order (for drag reorder)
  const orderedTasks = React.useMemo(() => {
    if (orderedTaskIds.length === 0) return tasks;
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return orderedTaskIds.map((id) => taskMap.get(id)).filter(Boolean) as Task[];
  }, [tasks, orderedTaskIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedTasks, oldIndex, newIndex);
    setOrderedTaskIds(reordered.map((t) => t.id));

    // Compute new sort_order using midpoint approach
    const prev = reordered[newIndex - 1];
    const next = reordered[newIndex + 1];
    // For tasks with sortOrder=0 (default), use virtual index-based position
    const getOrder = (task: Task, idx: number) =>
      (task.sortOrder && task.sortOrder !== 0) ? task.sortOrder : (idx + 1) * 1000;
    const prevOrder = prev ? getOrder(prev, newIndex - 1) : 0;
    const nextOrder = next ? getOrder(next, newIndex + 1) : (newIndex + 2) * 1000;
    const newSortOrder = Math.max(1,
      !prev
        ? nextOrder - 1000
        : !next
          ? prevOrder + 1000
          : Math.round((prevOrder + nextOrder) / 2)
    );

    updateTaskMutate(
      { id: active.id as string, data: { sortOrder: newSortOrder } },
      {
        onError: () => {
          // Rollback local order on failure
          setOrderedTaskIds(tasks.map((t) => t.id));
          toast.error('Failed to reorder task');
        },
      },
    );
  }

  function handleBulkSelect(id: string, checked: boolean) {
    setSelectedBulkIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleBulkSuccess() {
    setSelectedBulkIds(new Set());
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  // Fetch full task detail (with tags) for the right panel
  const { data: selectedTask, isError: taskFetchError } = useTask(selectedTaskId);

  React.useEffect(() => {
    if (taskFetchError) {
      toast.error('Failed to load task details');
    }
  }, [taskFetchError]);

  function handleSelectTask(id: string) {
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }

  function handleTagClick(tagName: string) {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName) ? prev.tags : [...prev.tags, tagName],
    }));
  }

  const activeDragTask = orderedTasks.find((t) => t.id === activeDragId) ?? null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Quick add bar */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2">
          <QuickAddBar
            onOpenFullForm={() => setIsCreationDialogOpen(true)}
            onTaskCreated={handleTaskCreated}
          />
        </div>

        {/* Filter chip bar */}
        <FilterChipBar filters={filters} onChange={setFilters} availableTags={availableTags ?? []} />

        {/* Task list */}
        {isPending ? (
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            <TaskRowSkeleton />
            <TaskRowSkeleton />
            <TaskRowSkeleton />
            <TaskRowSkeleton />
            <TaskRowSkeleton />
          </div>
        ) : tasks.length === 0 ? (
          isNonDefault(filters) ? (
            <EmptyState
              icon={Search}
              heading="No tasks match your filters"
              description="Try adjusting or clearing your filters to see more tasks."
            >
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                Clear filters
              </button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={ListTodo}
              heading="Your task list is empty"
              description="Ask your AI agent to get started — copy a prompt below and paste it into your chat"
              action={{ label: 'Connect an agent →', href: '/settings' }}
            >
              <div className="flex flex-col gap-2 w-full items-center">
                {ONBOARDING_PROMPTS.map((prompt) => (
                  <CopyablePromptBlock key={prompt} prompt={prompt} />
                ))}
              </div>
            </EmptyState>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <VirtualTaskList
              tasks={orderedTasks}
              selectedTaskId={selectedTaskId}
              highlightedTaskId={newTaskId}
              selectedBulkIds={selectedBulkIds}
              onSelect={handleSelectTask}
              onBulkSelect={handleBulkSelect}
              onTagClick={handleTagClick}
            />
            <DragOverlay>
              {activeDragTask && (
                <div className="shadow-lg rounded bg-background border border-border opacity-95">
                  <TaskRow
                    task={activeDragTask}
                    selected={false}
                    onSelect={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Bulk action bar — appears at bottom when ≥2 tasks selected */}
        {selectedBulkIds.size >= 2 && (
          <BulkActionBar
            selectedIds={Array.from(selectedBulkIds)}
            selectedTasks={orderedTasks.filter((t) => selectedBulkIds.has(t.id))}
            onClear={() => setSelectedBulkIds(new Set())}
            onSuccess={handleBulkSuccess}
          />
        )}
        {/* Task detail panel — rendered inline until Story 4.5 re-implements Sheet behavior */}
        {isRightPanelOpen && selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => {
              setSelectedTaskId(null);
              setIsRightPanelOpen(false);
            }}
            onTagClick={handleTagClick}
          />
        )}
      </div>

      <TaskCreationDialog
        open={isCreationDialogOpen}
        onOpenChange={setIsCreationDialogOpen}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
