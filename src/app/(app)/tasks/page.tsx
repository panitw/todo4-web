'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { TaskCard } from '@/components/tasks/task-card';
import { FilterChipBar, DEFAULT_FILTERS, isNonDefault, type TaskFilters } from '@/components/tasks/filter-chip-bar';
import { QuickAddBar } from '@/components/tasks/quick-add-bar';
import { TaskCreationDialog } from '@/components/tasks/task-creation-dialog';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { BulkActionBar } from '@/components/tasks/bulk-action-bar';
import { useTasks } from '@/hooks/use-tasks';
import { useTags } from '@/hooks/use-tags';
import { useTask } from '@/hooks/use-task';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useCloseTask } from '@/hooks/use-close-task';
import type { Task } from '@/lib/api/tasks';

const ONBOARDING_PROMPTS = [
  'Create a task called \'Review weekly goals\' with priority p2, due next Monday',
  'Add a task \'Research competitors\' with subtasks: check pricing, compare features, write summary',
  'Show me all my open tasks sorted by priority',
  'Create a recurring task \'Weekly team standup notes\' that repeats every Monday',
];

// Skeleton placeholder for loading state
function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#e2e8f0] shadow-sm p-3 md:p-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-muted shrink-0" />
        <div className="flex-1 h-4 rounded bg-muted" />
        <div className="w-4 h-4 rounded bg-muted shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-12 h-4 rounded bg-muted" />
        <div className="w-16 h-4 rounded bg-muted" />
        <div className="w-10 h-4 rounded bg-muted" />
      </div>
    </div>
  );
}

// SortableTaskCard: wraps TaskCard with @dnd-kit useSortable for drag reorder
function SortableTaskCard({
  task,
  virtualStart,
  measureRef,
  dataIndex,
  ...taskCardProps
}: {
  task: Task;
  virtualStart: number;
  measureRef: (el: Element | null) => void;
  dataIndex: number;
} & Omit<React.ComponentProps<typeof TaskCard>, 'task' | 'dragHandleProps' | 'isDragging'>) {
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
    <li
      ref={(el) => {
        setNodeRef(el);
        measureRef(el);
      }}
      data-index={dataIndex}
      style={style}
      className="px-1"
    >
      <TaskCard
        task={task}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        isDragging={isDragging}
        {...taskCardProps}
      />
    </li>
  );
}

function VirtualTaskList({
  tasks,
  selectedTaskId,
  highlightedTaskId,
  focusedIndex,
  editingTaskId,
  selectedBulkIds,
  onSelect,
  onBulkSelect,
  onTagClick,
  onCheckboxToggle,
  onTitleSave,
  onEditCancel,
  scrollRef,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  highlightedTaskId: string | null;
  focusedIndex: number;
  editingTaskId: string | null;
  selectedBulkIds: Set<string>;
  onSelect: (id: string) => void;
  onBulkSelect: (id: string, checked: boolean) => void;
  onTagClick?: (tagName: string) => void;
  onCheckboxToggle: (id: string) => void;
  onTitleSave: (id: string, newTitle: string) => void;
  onEditCancel: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer returns unstable refs by design
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    // Card heights: ~80px mobile, ~64px desktop. Use 80 as safe estimate.
    estimateSize: () => 80,
    overscan: 5,
    gap: 8,
  });

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < tasks.length) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, tasks.length, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul
          role="list"
          aria-label="Task list"
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          className="py-1"
        >
          {virtualItems.map((virtualRow) => {
            const task = tasks[virtualRow.index];
            return (
              <SortableTaskCard
                key={task.id}
                task={task}
                virtualStart={virtualRow.start}
                measureRef={virtualizer.measureElement}
                dataIndex={virtualRow.index}
                selected={task.id === selectedTaskId}
                highlighted={task.id === highlightedTaskId}
                focused={virtualRow.index === focusedIndex}
                editing={task.id === editingTaskId}
                isBulkSelected={selectedBulkIds.has(task.id)}
                isBulkMode={selectedBulkIds.size > 0}
                onSelect={onSelect}
                onBulkSelect={onBulkSelect}
                onTagClick={onTagClick}
                onCheckboxToggle={onCheckboxToggle}
                onTitleSave={onTitleSave}
                onEditCancel={onEditCancel}
              />
            );
          })}
        </ul>
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { mutate: updateTaskMutate, isPending: isReorderPending } = useUpdateTask();
  const { mutate: closeTaskMutate } = useCloseTask();

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

  const tasks = React.useMemo(() => data?.data ?? [], [data?.data]);

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

  const handleSelectTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }, []);

  function handleTagClick(tagName: string) {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName) ? prev.tags : [...prev.tags, tagName],
    }));
  }

  // Checkbox toggle: close task (no-op if already closed/archived)
  const handleCheckboxToggle = useCallback((id: string) => {
    const task = orderedTasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'closed' || task.status === 'archived') return;
    closeTaskMutate({ id }, {
      onSuccess: () => toast.success('Task closed'),
      onError: () => toast.error('Failed to close task'),
    });
  }, [orderedTasks, closeTaskMutate]);

  // Inline title editing
  const handleTitleSave = useCallback((id: string, newTitle: string) => {
    updateTaskMutate({ id, data: { title: newTitle } }, {
      onSuccess: () => {
        setEditingTaskId(null);
        toast.success('Title updated');
      },
      onError: () => toast.error('Failed to update title'),
    });
  }, [updateTaskMutate]);

  const handleEditCancel = useCallback(() => {
    setEditingTaskId(null);
  }, []);

  // Derive a safe focused index that is always in bounds
  const safeFocusedIndex = orderedTasks.length === 0
    ? -1
    : focusedIndex >= orderedTasks.length
      ? orderedTasks.length - 1
      : focusedIndex;

  // Keyboard navigation: Arrow keys, Enter, Space, F2, Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when an input/textarea/select is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (orderedTasks.length === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, orderedTasks.length - 1));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case 'Enter': {
          if (safeFocusedIndex >= 0) {
            e.preventDefault();
            handleSelectTask(orderedTasks[safeFocusedIndex].id);
          }
          break;
        }
        case ' ': {
          if (safeFocusedIndex >= 0) {
            e.preventDefault();
            handleCheckboxToggle(orderedTasks[safeFocusedIndex].id);
          }
          break;
        }
        case 'F2': {
          if (safeFocusedIndex >= 0) {
            e.preventDefault();
            setEditingTaskId(orderedTasks[safeFocusedIndex].id);
          }
          break;
        }
        case 'Escape': {
          setFocusedIndex(-1);
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [orderedTasks, safeFocusedIndex, handleCheckboxToggle, handleSelectTask]);

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
          <div className="flex-1 overflow-y-auto space-y-2 p-2">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
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
              focusedIndex={safeFocusedIndex}
              editingTaskId={editingTaskId}
              selectedBulkIds={selectedBulkIds}
              onSelect={handleSelectTask}
              onBulkSelect={handleBulkSelect}
              onTagClick={handleTagClick}
              onCheckboxToggle={handleCheckboxToggle}
              onTitleSave={handleTitleSave}
              onEditCancel={handleEditCancel}
              scrollRef={scrollRef}
            />
            <DragOverlay>
              {activeDragTask && (
                <div className="shadow-lg rounded-lg bg-background border border-border opacity-95">
                  <TaskCard
                    task={activeDragTask}
                    selected={false}
                    onSelect={() => {}}
                    onCheckboxToggle={() => {}}
                    onTitleSave={() => {}}
                    onEditCancel={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Bulk action bar */}
        {selectedBulkIds.size >= 2 && (
          <BulkActionBar
            selectedIds={Array.from(selectedBulkIds)}
            selectedTasks={orderedTasks.filter((t) => selectedBulkIds.has(t.id))}
            onClear={() => setSelectedBulkIds(new Set())}
            onSuccess={handleBulkSuccess}
          />
        )}
        {/* Task detail panel */}
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
