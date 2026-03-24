import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeTask } from '@/lib/api/tasks';

export function useCloseTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completionNote }: { id: string; completionNote?: string }) =>
      closeTask(id, { completionNote }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
