import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { account, mockApi, reply, survey } from '@/test/fixtures';
import { useAuthStore } from './auth';
import { useSurveysStore } from './surveys';

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.unstubAllGlobals());

  it('asks the server for the session and config only once', async () => {
    const fetchMock = mockApi({ 'GET /api/auth/me': reply(200, account()) });
    const auth = useAuthStore();

    await Promise.all([auth.init(), auth.init()]);
    await auth.init();

    expect(fetchMock).toHaveBeenCalledTimes(2); // /me and /config
    expect(auth.user?.displayName).toBe('Alice');
  });

  it('treats 401 from /me as a guest', async () => {
    mockApi({ 'GET /api/auth/me': reply(401, { code: 'unauthorized' }) });
    const auth = useAuthStore();

    await auth.init();

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.initialized).toBe(true);
  });

  it('a broken config endpoint does not block the app: email features just stay off', async () => {
    mockApi({ 'GET /api/auth/me': reply(200, account()), 'GET /api/auth/config': reply(500) });
    const auth = useAuthStore();

    await auth.init();

    expect(auth.isLoggedIn).toBe(true);
    expect(auth.config.emailEnabled).toBe(false);
  });

  it('needs confirmation only when the server requires it and the email is unconfirmed', async () => {
    mockApi({
      'GET /api/auth/me': reply(200, account({ emailConfirmed: false })),
      'GET /api/auth/config': reply(200, { emailEnabled: true, confirmationRequired: true }),
    });
    const auth = useAuthStore();
    await auth.init();

    expect(auth.needsConfirmation).toBe(true);
    auth.setUser(account({ emailConfirmed: true }));
    expect(auth.needsConfirmation).toBe(false);
  });

  it('wrong password keeps the user signed out and surfaces the error code', async () => {
    mockApi({ 'POST /api/auth/login': reply(401, { code: 'invalid_credentials' }) });
    const auth = useAuthStore();

    await expect(auth.login({ email: 'alice@example.com', password: 'nope' })).rejects.toMatchObject({ code: 'invalid_credentials' });

    expect(auth.isLoggedIn).toBe(false);
  });

  it('switching users drops the cached surveys of the previous one', async () => {
    mockApi({
      'POST /api/auth/login': [reply(200, account()), reply(200, account({ id: 2, displayName: 'Bob' }))],
      'GET /api/surveys/s1': reply(200, survey()),
    });
    const auth = useAuthStore();
    const surveys = useSurveysStore();
    await auth.login({ email: 'alice@example.com', password: 'Secret123' });
    await surveys.fetchSurvey('s1');

    await auth.login({ email: 'bob@example.com', password: 'Secret123' });

    expect(surveys.getSurvey('s1')).toBeUndefined();
  });

  it('confirming the email in a signed-in browser unlocks the account at once', async () => {
    mockApi({
      'POST /api/auth/login': reply(200, account({ emailConfirmed: false })),
      'POST /api/auth/confirm-email': reply(204),
      'GET /api/auth/me': reply(200, account({ emailConfirmed: true })),
    });
    const auth = useAuthStore();
    await auth.login({ email: 'alice@example.com', password: 'Secret123' });

    await auth.confirmEmail('token');

    expect(auth.user?.emailConfirmed).toBe(true);
  });

  it('logout clears the session even when the request fails', async () => {
    mockApi({ 'POST /api/auth/login': reply(200, account()), 'POST /api/auth/logout': reply(500) });
    const auth = useAuthStore();
    await auth.login({ email: 'alice@example.com', password: 'Secret123' });

    await expect(auth.logout()).rejects.toBeTruthy();

    expect(auth.isLoggedIn).toBe(false);
  });
});
