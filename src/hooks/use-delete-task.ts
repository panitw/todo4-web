import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask } from '@/lib/api/tasks';

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
