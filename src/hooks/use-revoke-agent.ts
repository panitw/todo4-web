import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revokeAgent, type Agent } from '@/lib/api/agents';
import { showSuccess, showError } from '@/lib/toast';

export function useRevokeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (id: string) => revokeAgent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['agents'] });
      const previous = queryClient.getQueryData<Agent[]>(['agents']);

      queryClient.setQueryData<Agent[]>(['agents'], (old) =>
        old ? old.filter((a) => a.id !== id) : old,
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agents'], context.previous);
      }
      showError('Failed to revoke agent');
    },
    onSuccess: () => {
      showSuccess('Agent revoked');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
