import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveTask } from '@/lib/api/tasks';

export function useArchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
