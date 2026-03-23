import { useQuery } from '@tanstack/react-query';
import { getTask } from '@/lib/api/tasks';

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
  });
}
