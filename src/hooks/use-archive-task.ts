import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveTask, type Task, type TaskListMeta } from '@/lib/api/tasks';

export function useArchiveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // Never auto-retry destructive operations
    mutationFn: (id: string) => archiveTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task', id] });

      const previousTasks = queryClient.getQueriesData<{ data: Task[]; meta: TaskListMeta }>({ queryKey: ['tasks'] });
      const previousTask = queryClient.getQueryData<Task>(['task', id]);

      // Optimistically mark as archived in all caches
      queryClient.setQueriesData<{ data: Task[]; meta: TaskListMeta }>(
        { queryKey: ['tasks'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === id ? { ...t, status: 'archived' as const } : t,
            ),
          };
        },
      );

      if (previousTask) {
        queryClient.setQueryData<Task>(['task', id], {
          ...previousTask,
          status: 'archived',
        });
      }

      return { previousTasks, previousTask, id };
    },
    onError: (_err, id, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousTask !== undefined) {
        queryClient.setQueryData(['task', id], context.previousTask);
      }
    },
    onSettled: (_, _err, id) => {
      void queryClient.invalidateQueries({ queryKey: ['task', id] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
