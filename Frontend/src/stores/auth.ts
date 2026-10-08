import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api';
import type { Credentials, User } from '@/api/types';
import { useSurveysStore } from './surveys';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  const isLoggedIn = computed(() => user.value !== null);

  /** Resolves the current session once; later calls reuse the same request. */
  function init(): Promise<void> {
    initPromise ??= authApi
      .me()
      .then((me) => {
        user.value = me;
      })
      .catch(() => {
        user.value = null;
      })
      .finally(() => {
        initialized.value = true;
      });
    return initPromise;
  }

  function setUser(next: User | null): void {
    if (next?.id !== user.value?.id) {
      // Cached surveys contain per-user data (my votes, author view).
      useSurveysStore().reset();
    }
    user.value = next;
    initialized.value = true;
    initPromise = Promise.resolve();
  }

  async function login(credentials: Credentials): Promise<User> {
    const me = await authApi.login(credentials);
    setUser(me);
    return me;
  }

  async function register(credentials: Credentials): Promise<User> {
    const me = await authApi.register(credentials);
    setUser(me);
    return me;
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }

  /** The server rejected our cookie (expired or the user is gone). */
  function sessionExpired(): void {
    setUser(null);
  }

  return { user, initialized, isLoggedIn, init, login, register, logout, sessionExpired };
});
