const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  data: T;
  meta: unknown;
  error: null;
}

interface ApiErrorResponse {
  data: null;
  meta: null;
  error: { code: string; message: string };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw Object.assign(new Error('Unexpected server response'), {
      status: res.status,
    });
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
