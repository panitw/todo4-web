import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, type CreateTaskInput } from '@/lib/api/tasks';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export type UseCreateTaskResult = ReturnType<typeof useCreateTask>;
