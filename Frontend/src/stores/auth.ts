import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api';
import type { Account, AuthConfig, Credentials, Registration } from '@/api/types';
import { useSurveysStore } from './surveys';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Account | null>(null);
  /** What the server supports; without email there is no confirmation and no password reset. */
  const config = ref<AuthConfig>({ emailEnabled: false, confirmationRequired: false });
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  const isLoggedIn = computed(() => user.value !== null);
  /** Signed in, but voting and creating stay locked until the email is confirmed. */
  const needsConfirmation = computed(
    () => !!user.value && config.value.confirmationRequired && !user.value.emailConfirmed,
  );

  /** Resolves the session and the server config once; later calls reuse the same requests. */
  function init(): Promise<void> {
    initPromise ??= Promise.all([
      authApi.me().then((me) => { user.value = me; }, () => { user.value = null; }),
      authApi.config().then((c) => { config.value = c; }, () => {}),
    ]).then(() => {
      initialized.value = true;
    });
    return initPromise;
  }

  function setUser(next: Account | null): void {
    if (next?.id !== user.value?.id) {
      // Cached surveys contain per-user data (my votes, author view).
      useSurveysStore().reset();
    }
    user.value = next;
    initialized.value = true;
    initPromise ??= authApi.config().then((c) => { config.value = c; }, () => {});
  }

  async function login(credentials: Credentials): Promise<Account> {
    const me = await authApi.login(credentials);
    setUser(me);
    return me;
  }

  async function register(registration: Registration): Promise<Account> {
    const me = await authApi.register(registration);
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

  async function confirmEmail(token: string): Promise<void> {
    await authApi.confirmEmail(token);
    // The link may be opened in a browser where this user is signed in: unlock right away.
    if (user.value) setUser(await authApi.me());
  }

  async function resetPassword(token: string, password: string): Promise<Account> {
    const me = await authApi.resetPassword(token, password);
    setUser(me);
    return me;
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<Account> {
    const me = await authApi.changePassword(currentPassword, newPassword);
    setUser(me);
    return me;
  }

  /** The server rejected our cookie (expired, password changed elsewhere, user gone). */
  function sessionExpired(): void {
    setUser(null);
  }

  return {
    user,
    config,
    initialized,
    isLoggedIn,
    needsConfirmation,
    init,
    setUser,
    login,
    register,
    logout,
    confirmEmail,
    resetPassword,
    changePassword,
    resendConfirmation: authApi.resendConfirmation,
    forgotPassword: authApi.forgotPassword,
    sessionExpired,
  };
});
