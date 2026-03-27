import { apiFetch } from './client';

export interface TagItem {
  name: string;
  namespace: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  dueDate?: string; // ISO 8601, e.g. "2026-03-25"
  tags?: string[];
  recurrence?: 'daily' | 'weekly' | 'monthly' | null;
  referenceUrl?: string;
}

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
  assignedAgentId: string | null;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
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

export interface TaskHistory {
  id: string;
  taskId: string;
  actorType: 'human' | 'agent';
  actorId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string | null;
  authorType: 'human' | 'agent';
  agentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  dueDate?: string | null; // ISO 8601 or null to clear
  tags?: string[];
  recurrence?: 'daily' | 'weekly' | 'monthly' | null;
  referenceUrl?: string;
  sortOrder?: number;
}

export interface BulkActionInput {
  ids: string[];
  action: 'close' | 'set_priority' | 'archive' | 'delete';
  priority?: string;
}

export interface BulkActionResult {
  processed: number;
  failed: number;
}

export async function bulkAction(input: BulkActionInput): Promise<BulkActionResult> {
  return apiFetch<BulkActionResult>('/api/v1/tasks/bulk', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listTasks(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  tags?: string;
  dueAfter?: string;
  dueBefore?: string;
}): Promise<{ data: Task[]; meta: TaskListMeta }> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined)
    searchParams.set('page', String(params.page));
  if (params?.limit !== undefined)
    searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.tags) searchParams.set('tags', params.tags);
  if (params?.dueAfter) searchParams.set('dueAfter', params.dueAfter);
  if (params?.dueBefore) searchParams.set('dueBefore', params.dueBefore);

  const query = searchParams.toString();
  const path = `/api/v1/tasks${query ? `?${query}` : ''}`;

  return apiFetch<TaskListResponse>(path);
}

export async function listTags(): Promise<TagItem[]> {
  const response = await apiFetch<{ data: TagItem[] }>('/api/v1/tags');
  return response.data;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  return apiFetch<Task>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}`);
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput,
): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface CloseTaskInput {
  completionNote?: string;
  force?: boolean;
}

export async function closeTask(id: string, data?: CloseTaskInput): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}

export async function archiveTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}/archive`, { method: 'POST' });
}

export async function restoreTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}/restore`, { method: 'POST' });
}

export async function deleteTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/v1/tasks/${id}`, { method: 'DELETE' });
}

export async function listTaskHistory(taskId: string): Promise<TaskHistory[]> {
  return apiFetch<TaskHistory[]>(`/api/v1/tasks/${taskId}/history`);
}

export async function listTaskComments(
  taskId: string,
): Promise<TaskComment[]> {
  return apiFetch<TaskComment[]>(`/api/v1/tasks/${taskId}/comments`);
}

export async function createComment(
  taskId: string,
  body: string,
): Promise<TaskComment> {
  return apiFetch<TaskComment>(`/api/v1/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export async function listSubtasks(taskId: string): Promise<Subtask[]> {
  return apiFetch<Subtask[]>(`/api/v1/tasks/${taskId}/subtasks`);
}

export async function createSubtask(taskId: string, title: string): Promise<Subtask> {
  return apiFetch<Subtask>(`/api/v1/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  data: Partial<Pick<Subtask, 'title' | 'completed' | 'sortOrder'>>,
): Promise<Subtask> {
  return apiFetch<Subtask>(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE',
  });
}
