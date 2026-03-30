'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { CalendarGrid, toDateKey } from '@/components/calendar/calendar-grid';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { Fab } from '@/components/tasks/fab';
import { TaskCreationDialog } from '@/components/tasks/task-creation-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCalendarTasks } from '@/hooks/use-calendar-tasks';
import { useTask } from '@/hooks/use-task';
import { useUpdateTask } from '@/hooks/use-update-task';
import { useCloseTask } from '@/hooks/use-close-task';
import { useCreateTaskAction } from '@/providers/create-task-provider';

function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-muted" />
          <div className="w-8 h-8 rounded bg-muted" />
          <div className="w-32 h-6 rounded bg-muted ml-2" />
        </div>
        <div className="w-16 h-8 rounded bg-muted" />
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-4 mx-2 rounded bg-muted" />
        ))}
      </div>
      {/* Grid cells */}
      <div className="grid grid-cols-7 border-t border-l border-border">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="border-r border-b border-border p-1 md:p-2 min-h-[44px] md:min-h-[64px]">
            <div className="w-7 h-7 rounded-full bg-muted mx-auto" />
          </div>
        ))}
      </div>
      {/* Task list skeleton */}
      <div className="mt-6 space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border shadow-sm p-3 md:p-4 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-muted shrink-0" />
              <div className="flex-1 h-4 rounded bg-muted" />
              <div className="w-4 h-4 rounded bg-muted shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-12 h-4 rounded bg-muted" />
              <div className="w-16 h-4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const { register: registerCreateTask } = useCreateTaskAction();
  const { mutate: updateTaskMutate } = useUpdateTask();
  const { mutate: closeTaskMutate } = useCloseTask();

  const { datesWithTasks, tasksForDate, isPending, isError: calendarError } = useCalendarTasks(
    displayYear,
    displayMonth,
    selectedDate,
  );

  const { data: selectedTask, isError: taskFetchError } = useTask(selectedTaskId);

  useEffect(() => {
    if (taskFetchError) {
      toast.error('Failed to load task details');
    }
  }, [taskFetchError]);

  useEffect(() => {
    if (calendarError) {
      toast.error('Failed to load calendar tasks');
    }
  }, [calendarError]);

  // Register with create-task context so the layout header button works
  const handleCreateTask = useCallback(() => {
    setIsCreationDialogOpen(true);
  }, []);

  useEffect(() => {
    const unregister = registerCreateTask(handleCreateTask);
    return unregister;
  }, [registerCreateTask, handleCreateTask]);

  const handlePrevMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev === 0) {
        setDisplayYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev === 11) {
        setDisplayYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleToday = useCallback(() => {
    const now = new Date();
    setDisplayYear(now.getFullYear());
    setDisplayMonth(now.getMonth());
    setSelectedDate(now);
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    // If selected date is outside the displayed month, navigate to that month
    setDisplayMonth((prev) => (date.getMonth() !== prev ? date.getMonth() : prev));
    setDisplayYear((prev) => (date.getFullYear() !== prev ? date.getFullYear() : prev));
  }, []);

  const handleCheckboxToggle = useCallback((id: string) => {
    const task = tasksForDate.find((t) => t.id === id);
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
  }, [tasksForDate, closeTaskMutate, updateTaskMutate]);

  const handleSelectTask = useCallback((id: string) => {
    detailTriggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedTaskId(id);
    setIsRightPanelOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null);
    setIsRightPanelOpen(false);
    setTimeout(() => detailTriggerRef.current?.focus(), 0);
  }, []);

  // ISO date string for the selected date (for creation dialog pre-fill)
  const selectedDateKey = toDateKey(selectedDate);

  if (isPending) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 max-w-4xl mx-auto w-full">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full p-4 md:p-6 max-w-4xl mx-auto w-full overflow-y-auto">
        <CalendarHeader
          year={displayYear}
          month={displayMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        <CalendarGrid
          year={displayYear}
          month={displayMonth}
          selectedDate={selectedDate}
          datesWithTasks={datesWithTasks}
          onSelectDate={handleSelectDate}
        />

        {/* Task list for selected date */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {tasksForDate.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No tasks due on this date
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasksForDate.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={task.id === selectedTaskId}
                  onSelect={handleSelectTask}
                  onCheckboxToggle={handleCheckboxToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* FAB — mobile only */}
        <Fab onClick={() => setIsCreationDialogOpen(true)} />
      </div>

      {/* Task detail panel in Sheet */}
      <Sheet
        open={isRightPanelOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md lg:max-w-lg p-0">
          {selectedTask ? (
            <TaskDetailPanel
              task={selectedTask}
              onClose={handleCloseDetail}
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <button
                  onClick={handleCloseDetail}
                  aria-label="Close task detail"
                  className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
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
        defaultDueDate={selectedDateKey}
      />
    </>
  );
}
