import { apiFetch } from './client';

export interface Agent {
  id: string;
  name: string;
  scope: 'read-only' | 'full-access';
  lastActiveAt: string | null;
  createdAt: string;
}

export async function listAgents(): Promise<Agent[]> {
  const response = await apiFetch<{ data: Agent[] }>('/api/v1/agents');
  return response.data;
}

export async function revokeAgent(id: string): Promise<void> {
  await apiFetch<{ data: null }>(`/api/v1/agents/${id}`, { method: 'DELETE' });
}
