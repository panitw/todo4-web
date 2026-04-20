import { useQuery } from '@tanstack/react-query';
import { listSubtasks, type Subtask } from '@/lib/api/tasks';

export function useSubtasks(taskId: string) {
  return useQuery<Subtask[]>({
    queryKey: ['subtasks', taskId],
    queryFn: () => listSubtasks(taskId),
    enabled: !!taskId,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}
