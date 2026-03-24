import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubtask, type Subtask } from '@/lib/api/tasks';

export function useUpdateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: Partial<Pick<Subtask, 'title' | 'completed' | 'sortOrder'>>;
    }) => updateSubtask(taskId, subtaskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
    },
  });
}
