import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask, type Task, type UpdateTaskInput, type TaskListMeta } from '@/lib/api/tasks';

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
      const previousTasks = queryClient.getQueriesData<{ data: Task[]; meta: TaskListMeta }>({ queryKey: ['tasks'] });
      const previousTask = queryClient.getQueryData<Task>(['task', id]);

      // Optimistically update the single task cache
      if (previousTask) {
        queryClient.setQueryData<Task>(['task', id], {
          ...previousTask,
          ...data,
        } as Task);
      }

      // Optimistically update in all task list caches
      queryClient.setQueriesData<{ data: Task[]; meta: TaskListMeta }>(
        { queryKey: ['tasks'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === id ? { ...t, ...data } as Task : t,
            ),
          };
        },
      );

      return { previousTasks, previousTask, id };
    },
    onError: (_err, { id }, context) => {
      // Rollback on failure
      if (context?.previousTask !== undefined) {
        queryClient.setQueryData(['task', id], context.previousTask);
      }
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSuccess: (updatedTask: Task) => {
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}
