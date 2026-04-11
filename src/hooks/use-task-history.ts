import { useQuery } from '@tanstack/react-query';
import { listTaskHistory } from '@/lib/api/tasks';

export function useTaskHistory(taskId: string | null) {
  return useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => listTaskHistory(taskId!),
    enabled: !!taskId,
  });
}
