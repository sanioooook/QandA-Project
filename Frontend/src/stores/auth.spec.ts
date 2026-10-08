import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { json, mockFetch, survey } from '@/test/fixtures';
import { useAuthStore } from './auth';
import { useSurveysStore } from './surveys';

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.unstubAllGlobals());

  it('asks the server for the session only once', async () => {
    const fetchMock = mockFetch(json(200, { id: 1, login: 'alice' }));
    const auth = useAuthStore();

    await Promise.all([auth.init(), auth.init()]);
    await auth.init();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(auth.user?.login).toBe('alice');
  });

  it('treats 401 from /me as a guest', async () => {
    mockFetch(json(401, { code: 'unauthorized' }));
    const auth = useAuthStore();

    await auth.init();

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.initialized).toBe(true);
  });

  it('wrong password keeps the user signed out and surfaces the error code', async () => {
    mockFetch(json(401, { code: 'invalid_credentials', title: 'Wrong login or password.' }));
    const auth = useAuthStore();

    await expect(auth.login({ login: 'alice', password: 'nope' })).rejects.toMatchObject({ code: 'invalid_credentials' });

    expect(auth.isLoggedIn).toBe(false);
  });

  it('switching users drops the cached surveys of the previous one', async () => {
    mockFetch(json(200, { id: 1, login: 'alice' }), json(200, survey()), json(200, { id: 2, login: 'bob' }));
    const auth = useAuthStore();
    const surveys = useSurveysStore();
    await auth.login({ login: 'alice', password: 'Secret123' });
    await surveys.fetchSurvey('s1');

    await auth.login({ login: 'bob', password: 'Secret123' });

    expect(surveys.getSurvey('s1')).toBeUndefined();
  });

  it('logout clears the session even when the request fails', async () => {
    mockFetch(json(200, { id: 1, login: 'alice' }), json(500));
    const auth = useAuthStore();
    await auth.login({ login: 'alice', password: 'Secret123' });

    await expect(auth.logout()).rejects.toBeTruthy();

    expect(auth.isLoggedIn).toBe(false);
  });
});
