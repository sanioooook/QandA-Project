import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { account, mockApi, reply } from '@/test/fixtures';
import { authGuard, routes, safeRedirect } from './index';

function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach(authGuard);
  return router;
}

describe('router guard', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.unstubAllGlobals());

  const guest = () => mockApi({ 'GET /api/auth/me': reply(401) });

  it('lets guests open a shared survey link and the active list', async () => {
    guest();
    const router = makeRouter();

    await router.push('/surveys/abc');
    expect(router.currentRoute.value.name).toBe('survey');
    await router.push('/surveys');
    expect(router.currentRoute.value.name).toBe('active');
  });

  it('does not hold public pages until the session is known', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const router = makeRouter();

    await router.push('/surveys');

    expect(router.currentRoute.value.name).toBe('active');
  });

  it.each(['/my', '/voted', '/surveys/new', '/surveys/abc/edit'])('sends guests from %s to login and keeps the target', async (path) => {
    guest();
    const router = makeRouter();

    await router.push(path);

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe(path);
  });

  it('sends signed-in users away from the login page to the redirect target', async () => {
    mockApi({ 'GET /api/auth/me': reply(200, account()) });
    const router = makeRouter();

    await router.push('/login?redirect=/my');

    expect(router.currentRoute.value.fullPath).toBe('/my');
  });

  it('lets guests open the registration page', async () => {
    guest();
    const router = makeRouter();

    await router.push('/register');

    expect(router.currentRoute.value.name).toBe('register');
  });

  it('shows not-found for unknown paths without asking for a login', async () => {
    guest();
    const router = makeRouter();

    await router.push('/no/such/page');

    expect(router.currentRoute.value.name).toBe('not-found');
  });
});

describe('safeRedirect', () => {
  it.each([
    ['/surveys/abc', '/surveys/abc'],
    ['/my?status=draft', '/my?status=draft'],
    ['//evil.example', null],
    ['https://evil.example', null],
    ['javascript:alert(1)', null],
    [undefined, null],
    [['/a', '/b'], null],
  ])('%s -> %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });
});
