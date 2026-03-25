import { useQuery } from '@tanstack/react-query';
import { listTags, type TagItem } from '@/lib/api/tasks';

export function useTags() {
  return useQuery<TagItem[]>({
    // NOTE: queryKey is not scoped by userId because no client-side user context is
    // available in this codebase. This is consistent with all other hooks. If multi-user
    // session switching is ever supported, call queryClient.clear() on logout.
    queryKey: ['tags'],
    queryFn: listTags,
    staleTime: 60_000, // tags change infrequently
  });
}
