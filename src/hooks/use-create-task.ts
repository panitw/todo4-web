import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, type CreateTaskInput, type Task, type TaskListMeta } from '@/lib/api/tasks';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onMutate: async (input) => {
      // Only cancel and update task list queries, not attention items
      const isTaskListQuery = (key: readonly unknown[]) =>
        key[0] === 'tasks' && !(key[1] && typeof key[1] === 'object' && 'attention' in key[1]);

      await queryClient.cancelQueries({
        queryKey: ['tasks'],
        predicate: (query) => isTaskListQuery(query.queryKey),
      });

      const previousTasks = queryClient.getQueriesData<{ data: Task[]; meta: TaskListMeta }>({
        queryKey: ['tasks'],
        predicate: (query) => isTaskListQuery(query.queryKey),
      });

      // Optimistically insert a temporary task at the top of every task list cache
      const optimisticTask: Task = {
        id: `optimistic-${crypto.randomUUID()}`,
        userId: '',
        title: input.title,
        description: input.description ?? null,
        agentNotes: null,
        completionNote: null,
        priority: input.priority ?? 'p4',
        status: input.status ?? 'open',
        dueDate: input.dueDate ?? null,
        recurrenceRule: input.recurrence ?? null,
        referenceUrl: input.referenceUrl ?? null,
        assignedAgentId: null,
        sortOrder: 0,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: input.tags ?? [],
      };

      queryClient.setQueriesData<{ data: Task[]; meta: TaskListMeta }>(
        { queryKey: ['tasks'], predicate: (query) => isTaskListQuery(query.queryKey) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [optimisticTask, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        },
      );

      return { previousTasks };
    },
    onError: (_err, _input, context) => {
      // Rollback all task list caches
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export type UseCreateTaskResult = ReturnType<typeof useCreateTask>;
