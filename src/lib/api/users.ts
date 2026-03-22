const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

interface ApiResponse<T> {
  data: T;
  meta: null;
  error: null;
}

interface ApiErrorResponse {
  data: null;
  meta: null;
  error: { code: string; message: string };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include', // send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiResponse<T> | ApiErrorResponse;
  try {
    body = (await res.json()) as ApiResponse<T> | ApiErrorResponse;
  } catch {
    throw Object.assign(new Error('Unexpected server response'), { status: res.status });
  }

  if (!res.ok) {
    const err = body as ApiErrorResponse;
    throw Object.assign(new Error(err.error?.message ?? 'Request failed'), {
      code: err.error?.code,
      status: res.status,
    });
  }

  return (body as ApiResponse<T>).data;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  return apiFetch<OAuthProvider[]>('/users/me/oauth-providers');
}

export async function disconnectOAuthProvider(provider: string): Promise<void> {
  await apiFetch<{ message: string }>(`/users/me/oauth-providers/${provider}`, {
    method: 'DELETE',
  });
}

export async function changePassword(data: ChangePasswordInput): Promise<void> {
  await apiFetch<{ message: string }>('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(password?: string): Promise<void> {
  await apiFetch<{ message: string }>('/users/me', {
    method: 'DELETE',
    body: JSON.stringify(password !== undefined ? { password } : {}),
  });
}

export async function cancelDeletion(): Promise<void> {
  await apiFetch<{ message: string }>('/users/me/cancel-deletion', {
    method: 'POST',
  });
}
