import { useQuery } from '@tanstack/react-query';
import { listTaskComments } from '@/lib/api/tasks';

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => listTaskComments(taskId!),
    enabled: !!taskId,
  });
}
