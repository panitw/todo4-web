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

// Module-scoped state for singleton token refresh and redirect coordination
let refreshPromise: Promise<void> | null = null;
export let redirectingToLogin = false;

function throwSessionExpiredRedirectError(): never {
  throw Object.assign(new Error('Session expired. Redirecting to login.'), {
    code: 'session_expired_redirect',
    status: 401,
  });
}

function redirectToLoginOnce(): never {
  if (!redirectingToLogin) {
    redirectingToLogin = true;

    if (typeof window !== 'undefined') {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      window.location.href = `/login?expired=true&next=${next}`;
    }
  }

  throwSessionExpiredRedirectError();
}

function buildRequestInit(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (init?.method ?? 'GET').toUpperCase();
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isMutatingMethod && !headers.has('X-Idempotency-Key')) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      headers.set('X-Idempotency-Key', crypto.randomUUID());
    }
  }

  return {
    ...init,
    credentials: 'include',
    headers,
  };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isRefreshRequest = path.includes('/auth/refresh');
  const canAttemptRefresh = !isRefreshRequest && !init?.signal?.aborted;
  const requestInit = buildRequestInit(init);

  const res = await fetch(path, requestInit);

  // 401 interception — silent refresh + retry (skip for refresh requests to avoid infinite loop)
  if (res.status === 401 && !redirectingToLogin && canAttemptRefresh) {
    if (!refreshPromise) {
      refreshPromise = fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      }).then((refreshRes) => {
        refreshPromise = null;
        if (!refreshRes.ok) throw new Error('refresh_failed');
      }).catch((err) => {
        refreshPromise = null;
        throw err;
      });
    }

    try {
      await refreshPromise;
    } catch {
      redirectToLoginOnce();
    }

    if (init?.signal?.aborted) {
      throw Object.assign(new Error('Request aborted'), {
        name: 'AbortError',
      });
    }

    const retryRes = await fetch(path, requestInit);

    if (retryRes.status === 401) {
      redirectToLoginOnce();
    }

    let retryBody: ApiResponse<T> | ApiErrorResponse;
    try {
      retryBody = (await retryRes.json()) as ApiResponse<T> | ApiErrorResponse;
    } catch {
      throw Object.assign(new Error('Unexpected server response'), {
        status: retryRes.status,
      });
    }

    if (!retryRes.ok) {
      const retryErr = retryBody as ApiErrorResponse;
      throw Object.assign(new Error(retryErr.error?.message ?? 'Request failed'), {
        code: retryErr.error?.code,
        status: retryRes.status,
      });
    }

    return (retryBody as ApiResponse<T>).data;
  }

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
