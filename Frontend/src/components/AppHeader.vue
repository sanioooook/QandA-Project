<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import PrefsControls from '@/components/PrefsControls.vue';
import UserMenu from '@/components/UserMenu.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const route = useRoute();
// From a survey page, signing in should bring the guest back to that survey.
const loginQuery = computed(() => (route.name === 'survey' ? { redirect: route.fullPath } : {}));
const { isLoggedIn } = storeToRefs(useAuthStore());
</script>

<template>
  <header class="header">
    <div class="bar">
      <RouterLink :to="{ name: 'active' }" class="brand">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <span>{{ t('app.name') }}</span>
      </RouterLink>

      <nav class="nav" aria-label="Main">
        <RouterLink :to="{ name: 'active' }">{{ t('nav.active') }}</RouterLink>
        <template v-if="isLoggedIn">
          <RouterLink :to="{ name: 'mine' }">{{ t('nav.mine') }}</RouterLink>
          <RouterLink :to="{ name: 'voted' }">{{ t('nav.voted') }}</RouterLink>
        </template>
      </nav>

      <div class="actions">
        <template v-if="isLoggedIn">
          <RouterLink :to="{ name: 'create' }" class="btn btn-primary btn-sm new" :aria-label="t('nav.newSurvey')">
            <AppIcon name="plus" :size="16" />
            <span>{{ t('nav.newSurvey') }}</span>
          </RouterLink>
          <UserMenu />
        </template>
        <template v-else>
          <PrefsControls />
          <RouterLink :to="{ name: 'login', query: loginQuery }" class="btn btn-sm btn-ghost">{{ t('nav.login') }}</RouterLink>
          <RouterLink :to="{ name: 'register', query: loginQuery }" class="btn btn-sm btn-primary">{{ t('nav.register') }}</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 10px 16px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.brand:hover {
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 4px;
  overflow-x: auto;
}

.nav a {
  padding: 7px 12px;
  border-radius: 999px;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.nav a:hover {
  color: var(--text);
  background: var(--surface-2);
  text-decoration: none;
}

.nav a.router-link-exact-active {
  color: var(--primary);
  background: var(--primary-soft);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}




@media (max-width: 960px) {
  .new span {
    display: none;
  }
}

@media (max-width: 900px) {
  .nav {
    order: 3;
    width: 100%;
  }
}
</style>
