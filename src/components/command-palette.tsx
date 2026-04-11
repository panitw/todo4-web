'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showInfo } from '@/lib/toast';
import {
  CalendarDays,
  FileDown,
  ListTodo,
  Plus,
  Link as LinkIcon,
  Settings,
} from 'lucide-react';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useCreateTaskAction } from '@/providers/create-task-provider';
import { useTasks } from '@/hooks/use-tasks';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask?: (taskId: string) => void;
}

const VIEWS = [
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Connections', href: '/connections', icon: LinkIcon },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export function CommandPalette({ open, onOpenChange, onSelectTask }: CommandPaletteProps) {
  const router = useRouter();
  const { trigger: triggerCreateTask } = useCreateTaskAction();
  const [search, setSearch] = useState('');

  // Reactive task data — subscribes to cache updates via useQuery
  const { data: tasksData } = useTasks();
  const uniqueTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);

  const handleSelect = useCallback(
    (callback: () => void) => {
      onOpenChange(false);
      callback();
    },
    [onOpenChange],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setSearch('');
        onOpenChange(nextOpen);
      }}
      title="Command Palette"
      description="Search tasks, views, and actions"
    >
      <Command shouldFilter>
        <CommandInput
          placeholder="Type to search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Tasks group — show when searching */}
          {search.length > 0 && uniqueTasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {uniqueTasks.slice(0, 10).map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.title}`}
                  onSelect={() =>
                    handleSelect(() => onSelectTask?.(task.id))
                  }
                >
                  <ListTodo className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Views group */}
          <CommandGroup heading="Views">
            {VIEWS.map((view) => (
              <CommandItem
                key={view.href}
                value={view.label}
                onSelect={() =>
                  handleSelect(() => router.push(view.href))
                }
              >
                <view.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {view.label}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Actions group */}
          <CommandGroup heading="Actions">
            <CommandItem
              value="Create task"
              onSelect={() =>
                handleSelect(() => triggerCreateTask())
              }
            >
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              Create task
            </CommandItem>
            <CommandItem
              value="Export CSV"
              onSelect={() =>
                handleSelect(() => {
                  showInfo('Export CSV is not yet available');
                })
              }
            >
              <FileDown className="mr-2 h-4 w-4 text-muted-foreground" />
              Export CSV
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
