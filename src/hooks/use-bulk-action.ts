import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkAction, type BulkActionInput, type BulkActionResult } from '@/lib/api/tasks';

export function useBulkAction() {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, Error, BulkActionInput>({
    mutationFn: bulkAction,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
