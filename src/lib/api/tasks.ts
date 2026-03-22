import { apiFetch } from './client';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  agentNotes: string | null;
  completionNote: string | null;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  status:
    | 'open'
    | 'in_progress'
    | 'waiting_for_human'
    | 'blocked'
    | 'closed'
    | 'archived'
    | 'pending_deletion';
  dueDate: string | null; // ISO 8601
  recurrenceRule: string | null;
  referenceUrl: string | null;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListMeta {
  page: number;
  limit: number;
  total: number;
}

interface TaskListResponse {
  data: Task[];
  meta: TaskListMeta;
}

export async function listTasks(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}): Promise<{ data: Task[]; meta: TaskListMeta }> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined)
    searchParams.set('page', String(params.page));
  if (params?.limit !== undefined)
    searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);

  const query = searchParams.toString();
  const path = `/tasks${query ? `?${query}` : ''}`;

  return apiFetch<TaskListResponse>(path);
}
