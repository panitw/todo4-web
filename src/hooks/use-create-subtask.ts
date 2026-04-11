import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSubtask } from '@/lib/api/tasks';

export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
    },
  });
}
