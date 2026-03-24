import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeTask } from '@/lib/api/tasks';

export function useCloseTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completionNote, force }: { id: string; completionNote?: string; force?: boolean }) =>
      closeTask(id, { completionNote, force }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
