'use client';

import { Archive } from 'lucide-react';
import { ThreeColumnShell } from '@/components/layout/three-column-shell';
import { AppLeftNav } from '@/components/shared/app-left-nav';
import { EmptyState } from '@/components/shared/empty-state';
import { useTasks } from '@/hooks/use-tasks';
import { TaskRow } from '@/components/tasks/task-row';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { useTask } from '@/hooks/use-task';
import React, { useState } from 'react';

export default function ArchivePage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const { data, isPending } = useTasks({ status: ['archived'] });
  const tasks = data?.data ?? [];

  const { data: selectedTask } = useTask(selectedTaskId);

  function handleSelectTask(id: string) {
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }

  const leftNav = <AppLeftNav />;

  const middle = (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Archive</h1>
      </div>

      {isPending ? (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 min-h-[48px] md:min-h-[36px] animate-pulse"
            >
              <div className="w-4 h-4 rounded bg-muted shrink-0" />
              <div className="w-6 h-3 rounded bg-muted shrink-0" />
              <div className="flex-1 h-3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Archive}
          heading="No archived tasks"
          description="Closed tasks you archive will appear here."
          action={{ label: 'View active tasks', href: '/tasks' }}
        />
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onSelect={handleSelectTask}
            />
          ))}
        </div>
      )}
    </div>
  );

  const effectiveRightPanelOpen = isRightPanelOpen && !!selectedTask;

  const right = selectedTask ? (
    <TaskDetailPanel
      task={selectedTask}
      onClose={() => {
        setSelectedTaskId(null);
        setIsRightPanelOpen(false);
      }}
    />
  ) : (
    <EmptyState
      icon={Archive}
      heading="Select a task to see details"
      description="Click on any archived task to view its details."
      action={{ label: 'Connect your first agent →', href: '/settings' }}
    />
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
