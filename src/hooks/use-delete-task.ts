import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask, type Task, type TaskListMeta } from '@/lib/api/tasks';

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // Never auto-retry destructive operations
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueriesData<{ data: Task[]; meta: TaskListMeta }>({ queryKey: ['tasks'] });

      // Optimistically remove the task from all task list caches
      queryClient.setQueriesData<{ data: Task[]; meta: TaskListMeta }>(
        { queryKey: ['tasks'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((t) => t.id !== id),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
          };
        },
      );

      return { previousTasks, id };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['task', id] });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
