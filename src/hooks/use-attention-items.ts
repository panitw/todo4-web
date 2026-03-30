import { useQuery } from '@tanstack/react-query';
import { listTasks, type Task, type TaskListMeta } from '@/lib/api/tasks';

/**
 * Fetches tasks that need human attention:
 * - pending_deletion (confirmation gates)
 * - waiting_for_human (agent questions)
 *
 * Polls every 30 seconds to surface new attention items promptly.
 */
export function useAttentionItems() {
  return useQuery<{ data: Task[]; meta: TaskListMeta }>({
    queryKey: ['tasks', { attention: true }],
    queryFn: () =>
      listTasks({
        status: 'pending_deletion,waiting_for_human',
        limit: 50,
      }),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}
