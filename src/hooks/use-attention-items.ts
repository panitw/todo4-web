import { useQuery } from '@tanstack/react-query';
import { listTasks, type Task, type TaskListMeta } from '@/lib/api/tasks';

/**
 * Fetches tasks that need human attention:
 * - pending_deletion (confirmation gates)
 * - waiting_for_human (agent questions)
 *
 * Polls every 60 seconds as a safety net when SSE updates are unavailable.
 */
export function useAttentionItems() {
  return useQuery<{ data: Task[]; meta: TaskListMeta }>({
    queryKey: ['tasks', { attention: true }],
    queryFn: () =>
      listTasks({
        status: 'pending_deletion,waiting_for_human',
        limit: 50,
      }),
    refetchInterval: 60_000,
    staleTime: 5_000,
  });
}
