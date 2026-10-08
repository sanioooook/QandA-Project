import { createPinia } from 'pinia';
import { createApp } from 'vue';
import type { RouterHistory } from 'vue-router';
import App from './App.vue';
import { setUnauthorizedHandler } from './api/http';
import { i18n } from './i18n';
import { createAppRouter } from './router';
import { useAuthStore } from './stores/auth';
import { usePrefsStore } from './stores/prefs';
import { useToastsStore } from './stores/toasts';

/** The whole app, wired the same way for the browser (main.ts) and the integration tests. */
export function createQandaApp(history?: RouterHistory) {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(i18n);
  usePrefsStore(pinia); // applies the saved theme and language

  const router = createAppRouter(history);

  setUnauthorizedHandler(() => {
    const auth = useAuthStore(pinia);
    if (!auth.isLoggedIn) return;
    auth.sessionExpired();
    useToastsStore(pinia).error(i18n.global.t('toast.sessionExpired'));
    void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  });

  app.use(router);
  return { app, router, pinia };
}
