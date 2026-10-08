<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppHeader from '@/components/AppHeader.vue';
import ConfirmEmailBanner from '@/components/ConfirmEmailBanner.vue';
import ToastHost from '@/components/ToastHost.vue';

const { t } = useI18n();
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
