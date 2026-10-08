import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { json, mockFetch } from '@/test/fixtures';
import { authGuard, routes, safeRedirect } from './index';

function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach(authGuard);
  return router;
}

describe('router guard', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.unstubAllGlobals());

  it('sends guests from a shared survey link to login and keeps the link', async () => {
    mockFetch(json(401));
    const router = makeRouter();

    await router.push('/surveys/abc');

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/surveys/abc');
  });

  it('sends signed-in users away from the login page to the redirect target', async () => {
    mockFetch(json(200, { id: 1, login: 'alice' }));
    const router = makeRouter();

    await router.push('/login?redirect=/my');

    expect(router.currentRoute.value.fullPath).toBe('/my');
  });

  it('lets guests open the registration page', async () => {
    mockFetch(json(401));
    const router = makeRouter();

    await router.push('/register');

    expect(router.currentRoute.value.name).toBe('register');
  });

  it('shows not-found for unknown paths without asking for a login', async () => {
    mockFetch(json(401));
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
