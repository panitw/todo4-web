import type { Task } from '@/lib/api/tasks';
import type { GroupByOption } from '@/components/tasks/view-settings-button';

export type VirtualHeaderItem = {
  type: 'header';
  id: string;
  label: string;
  colorClass?: string;
};

export type VirtualTaskItem = {
  type: 'task';
  id: string;
  task: Task;
};

export type VirtualItem = VirtualHeaderItem | VirtualTaskItem;

// Priority group ordering and colors
const PRIORITY_ORDER = ['p1', 'p2', 'p3', 'p4'];
const PRIORITY_GROUP_CONFIG: Record<string, { label: string; colorClass: string }> = {
  p1: { label: 'Critical', colorClass: 'text-red-600' },
  p2: { label: 'High', colorClass: 'text-orange-600' },
  p3: { label: 'Medium', colorClass: 'text-blue-600' },
  p4: { label: 'Low', colorClass: 'text-gray-500' },
};

function getDateGroupLabel(dateStr: string | null): string {
  if (!dateStr) return 'No Due Date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return 'Next Week';
  if (diffDays < 0) return 'Overdue';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Sort order for date groups
function getDateGroupOrder(label: string): number {
  if (label === 'Overdue') return 0;
  if (label === 'Today') return 1;
  if (label === 'Tomorrow') return 2;
  if (label === 'Next Week') return 3;
  if (label === 'No Due Date') return 999;
  return 4; // Future dates
}

export function buildVirtualItems(tasks: Task[], groupBy: GroupByOption): VirtualItem[] {
  if (groupBy === 'none') {
    return tasks.map((t) => ({ type: 'task', id: t.id, task: t }));
  }

  if (groupBy === 'priority') {
    const groups = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.priority;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    const items: VirtualItem[] = [];
    for (const p of PRIORITY_ORDER) {
      const groupTasks = groups.get(p);
      if (!groupTasks || groupTasks.length === 0) continue;
      const config = PRIORITY_GROUP_CONFIG[p];
      items.push({ type: 'header', id: `header-priority-${p}`, label: config.label, colorClass: config.colorClass });
      for (const task of groupTasks) {
        items.push({ type: 'task', id: task.id, task });
      }
    }
    return items;
  }

  if (groupBy === 'tag') {
    // Group by first tag; tasks with no tags go to "Untagged"
    const groups = new Map<string, Task[]>();
    for (const task of tasks) {
      const tag = task.tags && task.tags.length > 0 ? task.tags[0] : 'Untagged';
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag)!.push(task);
    }

    const items: VirtualItem[] = [];
    // Sort tags alphabetically, "Untagged" last
    const sortedKeys = [...groups.keys()].sort((a, b) => {
      if (a === 'Untagged') return 1;
      if (b === 'Untagged') return -1;
      return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
      const groupTasks = groups.get(key)!;
      items.push({ type: 'header', id: `header-tag-${key}`, label: key });
      for (const task of groupTasks) {
        items.push({ type: 'task', id: task.id, task });
      }
    }
    return items;
  }

  if (groupBy === 'date') {
    const groups = new Map<string, Task[]>();
    for (const task of tasks) {
      const label = getDateGroupLabel(task.dueDate);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(task);
    }

    const items: VirtualItem[] = [];
    const sortedKeys = [...groups.keys()].sort(
      (a, b) => getDateGroupOrder(a) - getDateGroupOrder(b),
    );

    for (const key of sortedKeys) {
      const groupTasks = groups.get(key)!;
      items.push({ type: 'header', id: `header-date-${key}`, label: key });
      for (const task of groupTasks) {
        items.push({ type: 'task', id: task.id, task });
      }
    }
    return items;
  }

  // fallback: flat list
  return tasks.map((t) => ({ type: 'task', id: t.id, task: t }));
}
