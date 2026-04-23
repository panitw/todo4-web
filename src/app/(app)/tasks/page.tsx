'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { showError, showSuccess } from '@/lib/toast';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { AttentionBlock } from '@/components/attention/attention-block';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTasks } from '@/hooks/use-tasks';
import { useTask } from '@/hooks/use-task';
import { useAttentionItems } from '@/hooks/use-attention-items';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useCloseTask } from '@/hooks/use-close-task';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useSearch } from '@/providers/search-provider';
import { useCreateTaskAction } from '@/providers/create-task-provider';
import { buildVirtualItems, type VirtualItem, type VirtualTaskItem } from '@/lib/group-tasks';
import { sortTasks, type SortTasksBy, type Task } from '@/lib/api/tasks';

const ONBOARDING_PROMPTS = [
  'Create a task called \'Review weekly goals\' with priority p2, due next Monday',
  'Add a task \'Research competitors\' with subtasks: check pricing, compare features, write summary',
  'Show me all my open tasks sorted by priority',
  'Create a recurring task \'Weekly team standup notes\' that repeats every Monday',
];

// Skeleton placeholder for loading state
function TaskCardSkeleton() {
  return (
    <div className="animate-pulse border-b border-border p-3 md:p-4">
      <div className="flex items-center gap-2">
        <div className="size-5 shrink-0 rounded bg-muted" />
        <div className="h-4 flex-1 rounded bg-muted" />
        <div className="size-4 shrink-0 rounded bg-muted" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-4 w-12 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-4 w-10 rounded bg-muted" />
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
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Use `top` for the virtualizer position so dnd-kit can independently
  // track its own transform for drag displacement & neighbor shifts.
  const style: React.CSSProperties = {
    position: 'absolute',
    top: virtualStart,
    left: 0,
    right: 0,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        measureRef(el);
      }}
      data-index={dataIndex}
      style={style}
      className="select-none"
      {...attributes}
      {...listeners}
      role="listitem"
      aria-roledescription="sortable"
      aria-describedby="dnd-instructions"
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
      return item.type === 'header' ? 44 : 76;
    },
    overscan: 5,
    gap: 0,
    // Cache measurements by stable id so items keep their height when they
    // move between groups (e.g., assigning a due date to a no-due-date task).
    getItemKey: (index) => virtualItems[index].id,
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
      <span id="dnd-instructions" className="sr-only">
        Press Space to pick up a task, use arrow keys to move it, Space to drop, or Escape to cancel.
      </span>
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

function TasksPageFallback() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 px-2 pt-6 pb-2">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageFallback />}>
      <TasksPageContent />
    </Suspense>
  );
}

const VALID_GROUP_BY_OPTIONS: readonly GroupByOption[] = ['none', 'tag', 'date', 'priority'];
const GROUP_BY_STORAGE_KEY = 'todo-web:tasks:groupBy';

function readStoredGroupBy(): GroupByOption | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GROUP_BY_STORAGE_KEY);
    if (!raw) return null;
    return (VALID_GROUP_BY_OPTIONS as readonly string[]).includes(raw) ? (raw as GroupByOption) : null;
  } catch {
    return null;
  }
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    ...DEFAULT_FILTERS,
    status: ['open', 'in_progress'],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  // Hydrate groupBy from localStorage post-mount (kept out of the useState
  // initializer to avoid SSR/client hydration mismatches). Also strips any
  // legacy ?group= param from the URL so the two never disagree.
  useEffect(() => {
    const stored = readStoredGroupBy();
    if (stored && stored !== 'none') setGroupBy(stored);
    if (window.location.search.includes('group=')) {
      const params = new URLSearchParams(window.location.search);
      params.delete('group');
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }
  }, []);
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
  const reorderInFlightRef = useRef(false);
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

  // Auto-sort: POST /tasks/sort then invalidate ['tasks'] to refetch
  const [isSortInFlight, setIsSortInFlight] = useState(false);
  const handleSort = useCallback(
    (by: SortTasksBy) => {
      setIsSortInFlight(true);
      sortTasks({ by })
        .then(() => {
          showSuccess('Tasks reordered');
        })
        .catch(() => {
          showError('Failed to reorder tasks');
        })
        .finally(() => {
          void queryClient.invalidateQueries({ queryKey: ['tasks'] });
          setIsSortInFlight(false);
        });
    },
    [queryClient],
  );

  const handleGroupByChange = useCallback((newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy);
    try {
      window.localStorage.setItem(GROUP_BY_STORAGE_KEY, newGroupBy);
    } catch {
      // ignore quota / disabled-storage errors
    }
  }, []);

  const { data, isPending } = useTasks({
    priority: filters.priority,
    status: filters.status,
    tags: filters.tags,
    dueAfter: filters.dueAfter || undefined,
    dueBefore: filters.dueBefore || undefined,
  });

  const tasks = useMemo(() => data?.data ?? [], [data?.data]);

  // Check if there are ANY tasks at all (across all statuses) for onboarding detection.
  // The API excludes closed/archived by default, so we must explicitly include them.
  const { data: allTasksData, isPending: isAllTasksPending } = useTasks({
    status: ['open', 'in_progress', 'closed', 'waiting_for_human', 'blocked', 'pending_deletion', 'archived'],
  });
  const hasAnyTasks = isAllTasksPending || (allTasksData?.data?.length ?? 0) > 0;

  // Attention items (pending_deletion + waiting_for_human) — polled every 30s
  const { data: attentionData } = useAttentionItems();
  const attentionTasks = useMemo(() => attentionData?.data ?? [], [attentionData?.data]);

  // Keep local ordering in sync with server data (server is source of truth for new data).
  // During a drag-reorder (reorderInFlightRef) or mutation (isReorderPending), preserve
  // the local order so the server refetch doesn't cause a visual snap-back.
  useEffect(() => {
    if (reorderInFlightRef.current || isReorderPending) {
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
    useSensor(TouchSensor, { activationConstraint: { delay: isDndEnabled ? 250 : 999999, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveDragId(null);
      return;
    }

    const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      setActiveDragId(null);
      return;
    }

    const reordered = arrayMove(orderedTasks, oldIndex, newIndex);
    // Guard against sync effect resetting order before mutation completes
    reorderInFlightRef.current = true;
    setOrderedTaskIds(reordered.map((t) => t.id));
    setActiveDragId(null);

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
          reorderInFlightRef.current = false;
          setOrderedTaskIds(tasks.map((t) => t.id));
          showError('Failed to reorder task');
        },
        onSettled: () => {
          // Wait for the refetch triggered by useUpdateTask's onSettled to complete,
          // then clear the reorder guard so server data can sync again.
          void queryClient.invalidateQueries({ queryKey: ['tasks'] }).then(() => {
            reorderInFlightRef.current = false;
          });
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
      showError('Failed to load task details');
    }
  }, [taskFetchError]);

  const detailTriggerRef = useRef<HTMLElement | null>(null);

  const handleSelectTask = useCallback((id: string) => {
    // Track the element that triggered the detail panel for focus return
    detailTriggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }, []);

  // Listen for command palette task selection
  useEffect(() => {
    function handleCommandSelect(e: Event) {
      const taskId = (e as CustomEvent<{ taskId: string }>).detail.taskId;
      handleSelectTask(taskId);
    }
    window.addEventListener('command-palette:select-task', handleCommandSelect);
    return () => window.removeEventListener('command-palette:select-task', handleCommandSelect);
  }, [handleSelectTask]);

  // Open task detail panel if navigated with ?task=<id> (e.g. from command palette)
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam) {
      handleSelectTask(taskParam);
    }
    // Only run on mount / when searchParams change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
        onSuccess: () => showSuccess('Task reopened'),
        onError: () => showError('Failed to reopen task'),
      });
    } else {
      closeTaskMutate({ id, force: true }, {
        onSuccess: () => showSuccess('Task done'),
        onError: () => showError('Failed to close task'),
      });
    }
  }, [orderedTasks, closeTaskMutate, updateTaskMutate]);

  // Inline title editing
  const handleTitleSave = useCallback((id: string, newTitle: string) => {
    updateTaskMutate({ id, data: { title: newTitle } }, {
      onSuccess: () => {
        setEditingTaskId(null);
        showSuccess('Title updated');
      },
      onError: () => showError('Failed to update title'),
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

  // Centralized keyboard shortcuts (C, /, E, Space, Enter, Arrows, F2, Escape)
  useKeyboardShortcuts(
    {
      onCreateTask: () => {
        setSelectedTaskId(null);
        setIsRightPanelOpen(false);
        setIsCreationDialogOpen(true);
      },
      onFocusSearch: () => {
        // Focus the desktop search input via the search context
        const searchInput = document.querySelector<HTMLInputElement>(
          'header input[aria-label="Search tasks"]',
        );
        searchInput?.focus();
      },
      onEditFocused: () => {
        const idx = focusedIndexRef.current;
        if (idx >= 0 && idx < taskOnlyItems.length) {
          handleSelectTask(taskOnlyItems[idx].id);
        }
      },
      onToggleFocused: () => {
        const idx = focusedIndexRef.current;
        if (idx >= 0 && idx < taskOnlyItems.length) {
          handleCheckboxToggle(taskOnlyItems[idx].id);
        }
      },
      onSelectFocused: () => {
        const idx = focusedIndexRef.current;
        if (idx >= 0 && idx < taskOnlyItems.length) {
          handleSelectTask(taskOnlyItems[idx].id);
        }
      },
      onMoveDown: () => {
        setFocusedIndex((prev) => Math.min(prev + 1, taskOnlyItems.length - 1));
      },
      onMoveUp: () => {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      },
      onEditModeFocused: () => {
        const idx = focusedIndexRef.current;
        if (idx >= 0 && idx < taskOnlyItems.length) {
          setEditingTaskId(taskOnlyItems[idx].id);
        }
      },
      onEscape: () => {
        setFocusedIndex(-1);
      },
    },
    { taskCount: taskOnlyItems.length, focusedIndex: safeFocusedIndex },
  );

  const activeDragTask = orderedTasks.find((t) => t.id === activeDragId) ?? null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Status tabs + View settings row — hidden when no tasks exist at all (onboarding state) */}
        {(isPending || hasAnyTasks) && (
          <>
            <div className="flex items-center justify-between px-3 border-b border-border">
              <StatusTabs activeTab={activeStatusTab} onTabChange={handleStatusTabChange} />
              <ViewSettingsButton
                groupBy={groupBy}
                onGroupByChange={handleGroupByChange}
                onSort={handleSort}
                sortDisabled={isSortInFlight}
              />
            </div>

            {/* Filter chips (priority, tags) */}
            <FilterBar filters={filters} onChange={handleFiltersChange} onClearAll={clearSearch} />
          </>
        )}

        {/* Needs Attention section */}
        {attentionTasks.length > 0 && (
          <div className="px-2 pt-2">
            <AttentionBlock tasks={attentionTasks} onSelectTask={handleSelectTask} />
          </div>
        )}

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
            >
              <Link
                href="/connections"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-85 active:opacity-75 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 [background-image:linear-gradient(135deg,#7c3aed,#3b82f6)]"
              >
                Connect an agent
              </Link>
              <div className="flex flex-col gap-2 w-full items-center mt-2">
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
            <DragOverlay dropAnimation={null}>
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
        open={isRightPanelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            setIsRightPanelOpen(false);
            // Return focus to the element that triggered the detail panel
            setTimeout(() => detailTriggerRef.current?.focus(), 0);
          }
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md lg:max-w-lg p-0">
          {selectedTask ? (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => {
                setSelectedTaskId(null);
                setIsRightPanelOpen(false);
                setTimeout(() => detailTriggerRef.current?.focus(), 0);
              }}
              onTagClick={handleTagClick}
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <button onClick={() => { setSelectedTaskId(null); setIsRightPanelOpen(false); setTimeout(() => detailTriggerRef.current?.focus(), 0); }}
                  aria-label="Close task detail" className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4 p-4 animate-pulse">
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-20 w-full bg-muted rounded" />
              </div>
            </div>
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
