import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreTask } from '@/lib/api/tasks';

export function useRestoreTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
