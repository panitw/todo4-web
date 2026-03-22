'use client';

import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ThreeColumnShell } from '@/components/layout/three-column-shell';
import { AppLeftNav } from '@/components/shared/app-left-nav';
import { TaskRow } from '@/components/tasks/task-row';
import { FilterChipBar, type TaskFilters } from '@/components/tasks/filter-chip-bar';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/lib/api/tasks';

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

function VirtualTaskList({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
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
      {/* Total height container so the scrollbar is accurate */}
      <div
        style={{ height: virtualizer.getTotalSize() }}
        className="relative divide-y divide-border"
      >
        {virtualItems.map((virtualRow) => {
          const task = tasks[virtualRow.index];
          return (
            <div
              key={task.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TaskRow
                task={task}
                selected={task.id === selectedTaskId}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    priority: ['p1', 'p2'],
    status: [],
  });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const { data, isPending } = useTasks({
    priority: filters.priority,
    status: filters.status,
  });

  const tasks = data?.data ?? [];

  function handleSelectTask(id: string) {
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }

  // Derive the selected task. If it's no longer in the current result set
  // (filtered out or pushed off page after a background refetch), treat as null
  // and close the panel — no setState needed, just derived rendering.
  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;
  const effectiveRightPanelOpen = isRightPanelOpen && selectedTask !== null;

  const leftNav = <AppLeftNav />;

  const middle = (
    <div className="flex flex-col h-full">
      {/* Filter chip bar */}
      <FilterChipBar filters={filters} onChange={setFilters} />

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
        <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center gap-3">
          <p className="text-lg font-medium text-muted-foreground">
            Your task list is empty
          </p>
          <p className="text-sm text-muted-foreground/70">
            Connect an AI agent to start adding tasks, or adjust your filters above.
          </p>
        </div>
      ) : (
        <VirtualTaskList
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelect={handleSelectTask}
        />
      )}
    </div>
  );

  const right = (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6">
      {selectedTask ? (
        <div className="w-full">
          <p className="font-medium text-foreground">{selectedTask.title}</p>
          {selectedTask.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedTask.description}
            </p>
          )}
        </div>
      ) : (
        <p>Select a task to see details</p>
      )}
    </div>
  );

  return (
    <ThreeColumnShell
      leftNav={leftNav}
      middle={middle}
      right={right}
      isRightPanelOpen={effectiveRightPanelOpen}
      onRightPanelOpenChange={setIsRightPanelOpen}
      sheetTitle={selectedTask?.title ?? 'Task Details'}
    />
  );
}
