import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask, type Task, type UpdateTaskInput } from '@/lib/api/tasks';

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any in-flight refetches for the task list and single task
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task', id] });

      // Snapshot previous values for rollback
      const previousTasks = queryClient.getQueryData(['tasks']);
      const previousTask = queryClient.getQueryData<Task>(['task', id]);

      // Optimistically update the single task cache
      if (previousTask) {
        queryClient.setQueryData<Task>(['task', id], {
          ...previousTask,
          ...data,
          // dueDate: keep as string (UpdateTaskInput uses string | null)
        } as Task);
      }

      return { previousTasks, previousTask, id };
    },
    onError: (_err, { id }, context) => {
      // Rollback on failure
      if (context?.previousTask !== undefined) {
        queryClient.setQueryData(['task', id], context.previousTask);
      }
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSuccess: (updatedTask: Task) => {
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}
