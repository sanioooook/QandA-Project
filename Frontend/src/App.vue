<script setup lang="ts">
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppHeader from '@/components/AppHeader.vue';
import ConfirmEmailBanner from '@/components/ConfirmEmailBanner.vue';
import ToastHost from '@/components/ToastHost.vue';
import { useAuthStore } from '@/stores/auth';
import { usePrefsStore } from '@/stores/prefs';

const { t } = useI18n();
const auth = useAuthStore();
const prefs = usePrefsStore();

// Emails go out in the account's language: keep it equal to the language chosen in the UI.
watch(
  () => [auth.user?.id, auth.user?.locale, prefs.locale] as const,
  ([id, saved, current]) => {
    if (id !== undefined && saved !== current) void auth.updateProfile({ locale: current }).catch(() => {});
  },
);
</script>

<template>
  <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>
  <AppHeader />
  <ConfirmEmailBanner />
  <main id="main" class="container">
    <RouterView />
  </main>
  <ToastHost />
</template>
