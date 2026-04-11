import { apiFetch } from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  profilePictureUrl: string | null;
  tosVersion: string | null;
  privacyVersion: string | null;
  currentTosVersion: string;
  currentPrivacyVersion: string;
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

export interface NotificationPreferences {
  agentTaskCreated: boolean;
  agentTaskUpdated: boolean;
  agentTaskClosed: boolean;
  agentDeletionRequest: boolean;
  overdueTaskNudge: boolean;
  weeklySummary: boolean;
}

export interface WebhookItem {
  id: string;
  url: string;
  hasSecret: boolean;
  createdAt: string;
}

export interface CalendarStatus {
  connected: boolean;
  connectedAt: string | null;
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

export async function recordConsent(
  tosVersion: string,
  privacyVersion: string,
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/users/me/consent', {
    method: 'POST',
    body: JSON.stringify({ tosVersion, privacyVersion }),
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

// ── Notification Preferences ──────────────────────────────────────────────────

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/api/v1/users/me/notification-preferences');
}

export async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/api/v1/users/me/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function getWebhooks(): Promise<WebhookItem[]> {
  const res = await apiFetch<{ data: WebhookItem[] }>('/api/v1/webhooks');
  return res.data;
}

export async function createWebhook(url: string, secret?: string): Promise<WebhookItem> {
  return apiFetch<WebhookItem>('/api/v1/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url, ...(secret ? { secret } : {}) }),
  });
}

export async function updateWebhook(id: string, url: string, secret?: string): Promise<WebhookItem> {
  return apiFetch<WebhookItem>(`/api/v1/webhooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ url, ...(secret ? { secret } : {}) }),
  });
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`/api/v1/webhooks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Request failed';
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      message = body.error?.message ?? message;
      code = body.error?.code;
    } catch {
      // Keep default message for non-JSON or empty responses.
    }

    throw Object.assign(new Error(message), {
      status: res.status,
      code,
    });
  }
}

// ── Google Calendar ───────────────────────────────────────────────────────────

export async function getCalendarStatus(): Promise<CalendarStatus> {
  return apiFetch<CalendarStatus>('/api/v1/users/me/calendar');
}

export async function disconnectCalendar(): Promise<void> {
  const res = await fetch('/api/v1/users/me/calendar', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Request failed';
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      message = body.error?.message ?? message;
      code = body.error?.code;
    } catch {
      // Keep default message for non-JSON or empty responses.
    }

    throw Object.assign(new Error(message), {
      status: res.status,
      code,
    });
  }
}
