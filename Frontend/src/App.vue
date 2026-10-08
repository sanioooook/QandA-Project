<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppHeader from '@/components/AppHeader.vue';
import ConfirmEmailBanner from '@/components/ConfirmEmailBanner.vue';
import ToastHost from '@/components/ToastHost.vue';
import PageSkeleton from '@/components/skeletons/PageSkeleton.vue';
import { useAuthStore } from '@/stores/auth';
import { usePrefsStore } from '@/stores/prefs';

const { t } = useI18n();
const auth = useAuthStore();
const routerReady = ref(false);
void useRouter().isReady().then(() => { routerReady.value = true; });
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
    <RouterView v-if="routerReady" />
    <!-- First visit to a page that needs the session: a page skeleton until the server answers. -->
    <PageSkeleton v-else />
  </main>
  <ToastHost />
</template>
