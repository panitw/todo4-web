import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/lib/api/tasks';

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(taskId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['task-comments', taskId],
      });
    },
  });
}
