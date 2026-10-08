import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { setUnauthorizedHandler } from './api/http';
import { i18n } from './i18n';
import { createAppRouter } from './router';
import { useAuthStore } from './stores/auth';
import { usePrefsStore } from './stores/prefs';
import { useToastsStore } from './stores/toasts';
import './styles/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
usePrefsStore(); // applies the saved theme and language

const router = createAppRouter();

setUnauthorizedHandler(() => {
  const auth = useAuthStore();
  if (!auth.isLoggedIn) return;
  auth.sessionExpired();
  useToastsStore().error(i18n.global.t('toast.sessionExpired'));
  void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
});

app.use(router);
app.mount('#app');
