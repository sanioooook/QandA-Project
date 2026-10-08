import { createRouter, createWebHistory, type RouteLocationNormalized, type RouteRecordRaw, type RouterHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Where almost every visit lands (lists, shared links): bundled with the app to save a round trip.
// The other pages load on demand.
import SurveyListView from '@/views/SurveyListView.vue';
import SurveyView from '@/views/SurveyView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    /** Only for signed-in users; guests are sent to the login page and brought back afterwards. */
    requiresAuth?: boolean;
    /** Login / registration: signed-in users are sent home. */
    guestOnly?: boolean;
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'active' } },
  { path: '/login', name: 'login', component: () => import('@/views/AuthView.vue'), props: { mode: 'login' }, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('@/views/AuthView.vue'), props: { mode: 'register' }, meta: { guestOnly: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue') },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/views/ResetPasswordView.vue') },
  { path: '/confirm-email', name: 'confirm-email', component: () => import('@/views/ConfirmEmailView.vue') },
  // Published surveys and results are public; voting asks for an account.
  { path: '/surveys', name: 'active', component: SurveyListView, props: { scope: 'active' } },
  { path: '/my', name: 'mine', component: SurveyListView, props: { scope: 'mine' }, meta: { requiresAuth: true } },
  { path: '/voted', name: 'voted', component: SurveyListView, props: { scope: 'voted' }, meta: { requiresAuth: true } },
  { path: '/surveys/new', name: 'create', component: () => import('@/views/SurveyEditView.vue'), meta: { requiresAuth: true } },
  { path: '/surveys/:id/edit', name: 'edit', component: () => import('@/views/SurveyEditView.vue'), props: true, meta: { requiresAuth: true } },
  { path: '/surveys/:id', name: 'survey', component: SurveyView, props: true },
  { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue'), meta: { requiresAuth: true } },
  { path: '/account/password', name: 'change-password', component: () => import('@/views/ChangePasswordView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
];

/** Only same-app paths are accepted as a post-login redirect target (no open redirects). */
export function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export async function authGuard(to: RouteLocationNormalized) {
  const auth = useAuthStore();
  const session = auth.init();
  // Public pages do not depend on who is signed in to load (the cookie goes with every request),
  // so they open at once and show their skeletons instead of a blank page on a slow first load.
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;
  await session;
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return safeRedirect(to.query.redirect) ?? { name: 'active' };
  }
  return true;
}

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  });
  router.beforeEach(authGuard);
  return router;
}
