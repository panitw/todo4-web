import { useMemo } from 'react';
import { useTasks } from './use-tasks';
import { toDateKey } from '@/components/calendar/calendar-grid';
import { toLocalDateKey } from '@/lib/date';

/**
 * Fetches tasks for a given month and derives:
 * - datesWithTasks: Set of ISO date strings that have tasks (for dot indicators)
 * - tasksForDate: filtered tasks for a specific selected date
 */
export function useCalendarTasks(year: number, month: number, selectedDate: Date) {
  // Compute date range covering the full 6-week grid (including leading/trailing days)
  const { dueAfter, dueBefore } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // leading days from previous month
    const gridStart = new Date(year, month, 1 - startOffset);
    const gridEnd = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 41); // 42 cells
    return {
      dueAfter: toDateKey(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() - 1)),
      dueBefore: toDateKey(new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate() + 1)),
    };
  }, [year, month]);

  const { data, isPending, isError } = useTasks({
    dueAfter,
    dueBefore,
    // Don't filter by status — show all non-archived tasks with due dates
    // The API excludes soft-deleted tasks by default
  });

  const tasks = useMemo(() => data?.data ?? [], [data?.data]);

  // Derive set of date keys that have tasks
  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      if (task.dueDate) {
        set.add(toLocalDateKey(task.dueDate));
      }
    }
    return set;
  }, [tasks]);

  // Filter tasks for selected date
  const selectedDateKey = toDateKey(selectedDate);
  const tasksForDate = useMemo(
    () => tasks.filter((t) => t.dueDate && toLocalDateKey(t.dueDate) === selectedDateKey),
    [tasks, selectedDateKey],
  );

  return { datesWithTasks, tasksForDate, isPending, isError };
}
