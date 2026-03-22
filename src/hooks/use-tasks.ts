import { useQuery } from '@tanstack/react-query';
import { listTasks, type Task, type TaskListMeta } from '@/lib/api/tasks';

export interface TaskFilters {
  priority?: ('p1' | 'p2' | 'p3' | 'p4')[];
  status?: string[];
}

export function useTasks(filters?: TaskFilters) {
  return useQuery<{ data: Task[]; meta: TaskListMeta }>({
    queryKey: ['tasks', filters],
    queryFn: () =>
      listTasks({
        priority:
          filters?.priority && filters.priority.length > 0
            ? filters.priority.join(',')
            : undefined,
        status:
          filters?.status && filters.status.length > 0
            ? filters.status.join(',')
            : undefined,
      }),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}
