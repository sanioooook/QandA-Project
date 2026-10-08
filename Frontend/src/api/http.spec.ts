import { afterEach, describe, expect, it, vi } from 'vitest';
import { json, mockFetch } from '@/test/fixtures';
import { ApiError, http, setUnauthorizedHandler } from './http';

describe('http client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('turns problem details into an ApiError with code and camelCase fields', async () => {
    mockFetch(json(400, { code: 'validation', title: 'Invalid', errors: { Login: ['login_length'] } }));

    const error = await http.post('/api/auth/register', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'validation', fields: { login: ['login_length'] } });
  });

  it('derives a code from the status when the body is not JSON', async () => {
    mockFetch(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(http.get('/api/surveys')).rejects.toMatchObject({ code: 'server_error', status: 502 });
  });

  it('reports network failures with the network code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(http.get('/api/surveys')).rejects.toMatchObject({ code: 'network', status: 0 });
  });

  it('calls the unauthorized handler for 401 outside the auth endpoints only', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch(json(401), json(401));

    await http.post('/api/auth/login', {}).catch(() => {});
    expect(handler).not.toHaveBeenCalled();

    await http.get('/api/surveys').catch(() => {});
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns undefined for 204 and sends JSON bodies', async () => {
    const fetchMock = mockFetch(json(204));

    await expect(http.post('/api/auth/logout')).resolves.toBeUndefined();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.credentials).toBe('same-origin');
  });
});
