/** Error returned by the API. `code` is the stable key from the backend's problem details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Field name (camelCase) -> error codes. */
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Called when a request (other than the auth endpoints themselves) gets 401: the session expired. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

const STATUS_CODES: Record<number, string> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  429: 'too_many_requests',
};

async function toApiError(response: Response): Promise<ApiError> {
  let body: { code?: string; title?: string; errors?: Record<string, string[]> } = {};
  try {
    body = await response.json();
  } catch {
    // Non-JSON error body (e.g. a proxy error page).
  }
  const fields = Object.fromEntries(
    Object.entries(body.errors ?? {}).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value]),
  );
  const code = body.code ?? STATUS_CODES[response.status] ?? (response.status >= 500 ? 'server_error' : 'unknown');
  return new ApiError(response.status, code, body.title ?? response.statusText, fields);
}

export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'Network error');
  }

  if (!response.ok) {
    const error = await toApiError(response);
    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      onUnauthorized?.();
    }
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  delete: (url: string) => request<void>('DELETE', url),
};
