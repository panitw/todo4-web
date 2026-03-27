import { apiFetch } from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  emailVerified: boolean;
  hasPassword: boolean;
  pendingEmail: string | null;
  deletionScheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthProvider {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  createdAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  timezone?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/users/me');
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  return apiFetch<OAuthProvider[]>('/api/v1/users/me/oauth-providers');
}

export async function disconnectOAuthProvider(provider: string): Promise<void> {
  await apiFetch<{ message: string }>(`/api/v1/users/me/oauth-providers/${provider}`, {
    method: 'DELETE',
  });
}

export async function changePassword(data: ChangePasswordInput): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(password?: string): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/users/me', {
    method: 'DELETE',
    body: JSON.stringify(password !== undefined ? { password } : {}),
  });
}

export async function cancelDeletion(): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/users/me/cancel-deletion', {
    method: 'POST',
  });
}

async function downloadBlob(path: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) {
    throw Object.assign(new Error('Export failed'), { status: res.status });
  }
  const blob = await res.blob();

  // Extract filename from Content-Disposition header, or use fallback
  const disposition = res.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="(.+?)"/);
  const filename = filenameMatch?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportCsv(): Promise<void> {
  return downloadBlob('/api/v1/users/me/export/csv', 'todo4-tasks.csv');
}

export async function exportJson(): Promise<void> {
  return downloadBlob('/api/v1/users/me/export/json', 'todo4-export.json');
}
