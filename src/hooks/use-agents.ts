import { useQuery } from '@tanstack/react-query';
import { listAgents } from '@/lib/api/agents';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
  });
}
