<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();

const state = ref<'pending' | 'done' | 'failed'>('pending');

// Confirming is idempotent and harmless, so the link confirms on open (no extra click).
onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  if (!token) {
    state.value = 'failed';
    return;
  }
  try {
    await auth.confirmEmail(token);
    state.value = 'done';
  } catch {
    state.value = 'failed';
  }
});
</script>

<template>
  <AuthCard :title="t('auth.confirmTitle')">
    <p v-if="state === 'pending'" class="muted" aria-busy="true">{{ t('auth.confirming') }}</p>
    <template v-else-if="state === 'done'">
      <p class="alert alert-info" role="status">{{ t('auth.confirmed') }}</p>
      <RouterLink :to="{ name: 'active' }" class="btn btn-primary btn-block">{{ t('notFound.home') }}</RouterLink>
    </template>
    <template v-else>
      <p class="alert alert-error" role="alert">{{ t('errors.token_invalid') }}</p>
      <p class="muted">{{ auth.isLoggedIn ? t('auth.confirmRetrySignedIn') : t('auth.confirmRetry') }}</p>
      <RouterLink :to="{ name: auth.isLoggedIn ? 'active' : 'login' }" class="btn btn-block">
        {{ auth.isLoggedIn ? t('notFound.home') : t('nav.login') }}
      </RouterLink>
    </template>
  </AuthCard>
</template>
