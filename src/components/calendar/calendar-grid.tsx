'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const SHORT_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FULL_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Returns an array of 42 Date objects (6 weeks) for the calendar grid */
function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const start = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  selectedDate: Date;
  datesWithTasks: Set<string>; // ISO date strings like "2026-03-15"
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({
  year,
  month,
  selectedDate,
  datesWithTasks,
  onSelectDate,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  return (
    <div role="grid" aria-label="Calendar">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1" role="row">
        {SHORT_DAY_LABELS.map((short, i) => (
          <div
            key={i}
            role="columnheader"
            className="text-center text-muted-foreground text-xs font-medium uppercase py-1"
          >
            <span className="md:hidden">{short}</span>
            <span className="hidden md:inline">{FULL_DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 border-t border-l border-border" role="rowgroup">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = toDateKey(day);
          const hasTasks = datesWithTasks.has(dateKey);

          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${hasTasks ? ', has tasks' : ''}`}
              aria-selected={isSelected}
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative flex flex-col items-center justify-start border-r border-b border-border p-1 md:p-2 min-h-[44px] md:min-h-[64px] transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                !isCurrentMonth && 'text-muted-foreground/40',
                isSelected && 'bg-[var(--todo-primary-subtle)]',
              )}
            >
              <span
                className={cn(
                  'text-sm md:text-base w-7 h-7 flex items-center justify-center rounded-full',
                  isToday && !isSelected && 'bg-[var(--todo-primary-subtle)] text-[var(--todo-primary)] font-semibold',
                  isSelected && 'text-white font-semibold [background-image:linear-gradient(135deg,#7c3aed,#3b82f6)]',
                )}
              >
                {day.getDate()}
              </span>
              {hasTasks && (
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[var(--todo-primary)]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { toDateKey, isSameDay };
