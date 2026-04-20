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
      // Keep subtaskCount / completedSubtaskCount badges on list + detail
      // views in sync after toggling a subtask from the inline card view.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}
