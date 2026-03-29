'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ListTodo, Search, X } from 'lucide-react';
// Plus icon removed — "New Task" button now lives in layout header
import { EmptyState } from '@/components/shared/empty-state';
import { CopyablePromptBlock } from '@/components/shared/copyable-prompt-block';
import { TaskCard } from '@/components/tasks/task-card';
import { FilterBar, DEFAULT_FILTERS, isNonDefault, type TaskFilters } from '@/components/tasks/filter-bar';
import { StatusTabs } from '@/components/tasks/status-tabs';
import { ViewSettingsButton, type GroupByOption } from '@/components/tasks/view-settings-button';
import { GroupHeader } from '@/components/tasks/group-header';
import { Fab } from '@/components/tasks/fab';
import { TaskCreationDialog } from '@/components/tasks/task-creation-dialog';
// QuickAddBar removed — replaced by FAB (mobile) + "New Task" button (desktop) + C shortcut
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { BulkActionBar } from '@/components/tasks/bulk-action-bar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTasks } from '@/hooks/use-tasks';
import { useTask } from '@/hooks/use-task';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useCloseTask } from '@/hooks/use-close-task';
import { useSearch } from '@/providers/search-provider';
import { useCreateTaskAction } from '@/providers/create-task-provider';
import { buildVirtualItems, type VirtualItem, type VirtualTaskItem } from '@/lib/group-tasks';
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
} & Omit<React.ComponentProps<typeof TaskCard>, 'task' | 'isDragging'>) {
  const {
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
        isDragging={isDragging}
        {...taskCardProps}
      />
    </li>
  );
}

function VirtualTaskList({
  virtualItems,
  selectedTaskId,
  highlightedTaskId,
  focusedIndex,
  editingTaskId,
  selectedBulkIds,
  searchQuery,
  onSelect,
  onBulkSelect,
  onTagClick,
  onCheckboxToggle,
  onTitleSave,
  onEditCancel,
  scrollRef,
}: {
  virtualItems: VirtualItem[];
  selectedTaskId: string | null;
  highlightedTaskId: string | null;
  focusedIndex: number;
  editingTaskId: string | null;
  selectedBulkIds: Set<string>;
  searchQuery: string;
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
    count: virtualItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      return item.type === 'header' ? 32 : 80;
    },
    overscan: 5,
    gap: 8,
  });

  // Scroll focused item into view (map focusedIndex in task-only space to virtualItems index)
  const taskOnlyItems = useMemo(
    () => virtualItems.filter((item): item is VirtualTaskItem => item.type === 'task'),
    [virtualItems],
  );

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < taskOnlyItems.length) {
      const focusedTaskId = taskOnlyItems[focusedIndex].id;
      const vIdx = virtualItems.findIndex((item) => item.id === focusedTaskId);
      if (vIdx >= 0) {
        virtualizer.scrollToIndex(vIdx, { align: 'auto' });
      }
    }
  }, [focusedIndex, taskOnlyItems, virtualItems, virtualizer]);

  const virtualRows = virtualizer.getVirtualItems();

  // Task IDs for SortableContext (only task items, not headers)
  const sortableIds = useMemo(
    () => virtualItems.filter((item) => item.type === 'task').map((item) => item.id),
    [virtualItems],
  );

  // Track which task index each virtual item maps to (for focused state)
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let taskIdx = 0;
    for (const item of virtualItems) {
      if (item.type === 'task') {
        map.set(item.id, taskIdx);
        taskIdx++;
      }
    }
    return map;
  }, [virtualItems]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto pt-2">
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <ul
          role="list"
          aria-label="Task list"
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          className="pb-1"
        >
          {virtualRows.map((virtualRow) => {
            const item = virtualItems[virtualRow.index];

            if (item.type === 'header') {
              return (
                <li
                  key={item.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  aria-label={`Group: ${item.label}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translate3d(0px, ${virtualRow.start}px, 0)`,
                  }}
                  className="px-1"
                >
                  <GroupHeader label={item.label} colorClass={item.colorClass} />
                </li>
              );
            }

            const task = item.task;
            const taskIdx = taskIndexMap.get(item.id) ?? -1;

            return (
              <SortableTaskCard
                key={task.id}
                task={task}
                virtualStart={virtualRow.start}
                measureRef={virtualizer.measureElement}
                dataIndex={virtualRow.index}
                selected={task.id === selectedTaskId}
                highlighted={task.id === highlightedTaskId}
                focused={taskIdx === focusedIndex}
                editing={task.id === editingTaskId}
                searchQuery={searchQuery}
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
    ...DEFAULT_FILTERS,
    status: ['open', 'in_progress'],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [activeStatusTab, setActiveStatusTab] = useState<string | null>('active');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [orderedTaskIds, setOrderedTaskIds] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(focusedIndex);
  const queryClient = useQueryClient();
  const { mutate: updateTaskMutate, isPending: isReorderPending } = useUpdateTask();
  const { mutate: closeTaskMutate } = useCloseTask();
  const { register: registerSearch, setQuery: setSearchContextQuery } = useSearch();
  const { register: registerCreateTask } = useCreateTaskAction();

  // Register with search context so the layout's top bar search works
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  useEffect(() => {
    const unregister = registerSearch(handleSearchChange);
    return unregister;
  }, [registerSearch, handleSearchChange]);

  // Register with create-task context so the layout header button works
  const handleCreateTask = useCallback(() => {
    setIsCreationDialogOpen(true);
  }, []);

  useEffect(() => {
    const unregister = registerCreateTask(handleCreateTask);
    return unregister;
  }, [registerCreateTask, handleCreateTask]);

  // Sync search context query when clearing filters
  const clearSearch = useCallback(() => {
    setSearchContextQuery('');
    handleSearchChange('');
  }, [setSearchContextQuery, handleSearchChange]);

  function handleTaskCreated(taskId: string) {
    setNewTaskId(taskId);
    setTimeout(() => setNewTaskId(null), 1500);
  }

  // StatusTabs → filters sync: when a tab is clicked, update filters.status with the tab's statuses
  const handleStatusTabChange = useCallback((tab: string | null, statuses: string[]) => {
    setActiveStatusTab(tab);
    setFilters((prev) => ({
      ...prev,
      status: statuses,
    }));
  }, []);

  // When filter chips change, preserve the active tab's status filter
  const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
    setFilters((prev) => ({
      ...newFilters,
      // Preserve current status filter (controlled by tabs, not filter bar)
      status: prev.status,
    }));
  }, []);

  const { data, isPending } = useTasks({
    priority: filters.priority,
    status: filters.status,
    tags: filters.tags,
    dueAfter: filters.dueAfter || undefined,
    dueBefore: filters.dueBefore || undefined,
  });

  const tasks = useMemo(() => data?.data ?? [], [data?.data]);

  // Keep local ordering in sync with server data (server is source of truth for new data)
  useEffect(() => {
    if (isReorderPending) {
      // During reorder, still merge in any new tasks so they aren't silently dropped
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: merges new server tasks into local drag-reorder state
      setOrderedTaskIds((prev) => {
        const existingSet = new Set(prev);
        const newIds = tasks.map((t) => t.id).filter((id) => !existingSet.has(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });
      return;
    }
    setOrderedTaskIds(tasks.map((t) => t.id));
  }, [tasks, isReorderPending]);

  // Derive ordered task array from local order (for drag reorder)
  const orderedTasks = useMemo(() => {
    if (orderedTaskIds.length === 0) return tasks;
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return orderedTaskIds.map((id) => taskMap.get(id)).filter(Boolean) as Task[];
  }, [tasks, orderedTaskIds]);

  // Apply client-side search filter
  const filteredTasks = useMemo(() => {
    if (searchQuery.length < 2) return orderedTasks;
    const q = searchQuery.toLowerCase();
    return orderedTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [orderedTasks, searchQuery]);

  // Build virtual items with group-by
  const virtualItemsList = useMemo(
    () => buildVirtualItems(filteredTasks, groupBy),
    [filteredTasks, groupBy],
  );

  // Task-only items for keyboard navigation
  const taskOnlyItems = useMemo(
    () => filteredTasks,
    [filteredTasks],
  );

  // Disable DnD when search is active or group-by is active to prevent reorder index mismatch
  const isDndEnabled = searchQuery.length < 2 && groupBy === 'none';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: isDndEnabled ? 8 : Infinity } }),
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

  useEffect(() => {
    if (taskFetchError) {
      toast.error('Failed to load task details');
    }
  }, [taskFetchError]);

  const handleSelectTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }, []);

  function handleTagClick(tagName: string) {
    // Compute new tags from current state (consistent for both setState and URL sync)
    const newTags = filters.tags.includes(tagName) ? filters.tags : [...filters.tags, tagName];
    setFilters((prev) => ({ ...prev, tags: prev.tags.includes(tagName) ? prev.tags : [...prev.tags, tagName] }));
    // Sync tag filters to URL synchronously
    const params = new URLSearchParams(window.location.search);
    if (newTags.length > 0) {
      params.set('tag', newTags.join(','));
    } else {
      params.delete('tag');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  // Checkbox toggle: close task, or reopen if already closed
  // Only toggle between open/in_progress ↔ closed. Skip non-standard statuses.
  const handleCheckboxToggle = useCallback((id: string) => {
    const task = orderedTasks.find((t) => t.id === id);
    if (!task) return;
    const toggleable = new Set(['open', 'in_progress', 'closed']);
    if (!toggleable.has(task.status)) return;
    if (task.status === 'closed') {
      updateTaskMutate({ id, data: { status: 'open' } }, {
        onSuccess: () => toast.success('Task reopened'),
        onError: () => toast.error('Failed to reopen task'),
      });
    } else {
      closeTaskMutate({ id, force: true }, {
        onSuccess: () => toast.success('Task done'),
        onError: () => toast.error('Failed to close task'),
      });
    }
  }, [orderedTasks, closeTaskMutate, updateTaskMutate]);

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
  const safeFocusedIndex = taskOnlyItems.length === 0
    ? -1
    : focusedIndex >= taskOnlyItems.length
      ? taskOnlyItems.length - 1
      : focusedIndex;

  // Keep ref in sync so keyboard handler always reads the latest value
  useEffect(() => {
    focusedIndexRef.current = safeFocusedIndex;
  }, [safeFocusedIndex]);

  // Keyboard navigation: Arrow keys, Enter, Space, F2, Escape, C (create)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when an interactive element is focused
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (target?.isContentEditable) return;
      // Also skip if inside a dialog/sheet overlay
      if (target?.closest('[data-slot="sheet-content"]')) return;

      // C shortcut to open creation panel (desktop)
      if (e.key === 'c' || e.key === 'C') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          // Close detail panel if open before opening creation
          setSelectedTaskId(null);
          setIsRightPanelOpen(false);
          setIsCreationDialogOpen(true);
          return;
        }
      }

      // For Space key, only intercept on body/task-list to avoid hijacking buttons/links
      if (e.key === ' ' && tag !== 'BODY' && !target?.closest('[role="list"]')) return;
      if (taskOnlyItems.length === 0) return;

      // Read latest focused index from ref to avoid stale closure
      const currentFocusedIndex = focusedIndexRef.current;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, taskOnlyItems.length - 1));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case 'Enter': {
          if (currentFocusedIndex >= 0) {
            e.preventDefault();
            handleSelectTask(taskOnlyItems[currentFocusedIndex].id);
          }
          break;
        }
        case ' ': {
          if (currentFocusedIndex >= 0) {
            e.preventDefault();
            handleCheckboxToggle(taskOnlyItems[currentFocusedIndex].id);
          }
          break;
        }
        case 'F2': {
          if (currentFocusedIndex >= 0) {
            e.preventDefault();
            setEditingTaskId(taskOnlyItems[currentFocusedIndex].id);
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
  }, [taskOnlyItems, handleCheckboxToggle, handleSelectTask]);

  const activeDragTask = orderedTasks.find((t) => t.id === activeDragId) ?? null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Mobile search row — hidden on desktop where layout top bar provides search */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border md:hidden">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              setSearchContextQuery(value);
            }}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => clearSearch()}
              className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status tabs + View settings row */}
        <div className="flex items-center justify-between px-3 border-b border-border">
          <StatusTabs activeTab={activeStatusTab} onTabChange={handleStatusTabChange} />
          <ViewSettingsButton groupBy={groupBy} onGroupByChange={setGroupBy} />
        </div>

        {/* Filter chips (priority, tags) */}
        <FilterBar filters={filters} onChange={handleFiltersChange} onClearAll={clearSearch} />

        {/* Task list */}
        {isPending ? (
          <div className="flex-1 overflow-y-auto space-y-2 px-2 pt-6 pb-2">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          isNonDefault(filters) ? (
            <EmptyState
              icon={Search}
              heading="No tasks match your filters"
              description="Try adjusting or clearing your filters to see more tasks."
            >
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...DEFAULT_FILTERS });
                  clearSearch();
                  setActiveStatusTab(null);
                }}
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
              virtualItems={virtualItemsList}
              selectedTaskId={selectedTaskId}
              highlightedTaskId={newTaskId}
              focusedIndex={safeFocusedIndex}
              editingTaskId={editingTaskId}
              selectedBulkIds={selectedBulkIds}
              searchQuery={searchQuery}
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

        {/* FAB — mobile only */}
        <Fab onClick={() => setIsCreationDialogOpen(true)} />

      </div>

      {/* Task detail panel in Sheet */}
      <Sheet
        open={isRightPanelOpen && !!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            setIsRightPanelOpen(false);
          }
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md lg:max-w-lg p-0">
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => {
                setSelectedTaskId(null);
                setIsRightPanelOpen(false);
              }}
              onTagClick={handleTagClick}
            />
          )}
        </SheetContent>
      </Sheet>

      <TaskCreationDialog
        open={isCreationDialogOpen}
        onOpenChange={setIsCreationDialogOpen}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
