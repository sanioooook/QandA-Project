<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue';
import { useI18n } from 'vue-i18n';

defineProps<{ title: string; subtitle?: string }>();
const { t } = useI18n();
</script>

<template>
  <section class="auth">
    <div class="intro">
      <AppLogo :size="48" />
      <p class="muted">{{ t('app.tagline') }}</p>
    </div>
    <div class="card panel">
      <div class="head">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="muted">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.auth {
  display: grid;
  justify-items: center;
  gap: 20px;
  padding-top: clamp(8px, 6vh, 56px);
}

.intro {
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.panel {
  display: grid;
  gap: 18px;
  width: 100%;
  max-width: 420px;
  padding: 28px;
}

.panel :deep(form) {
  display: grid;
  gap: 18px;
}

.head {
  display: grid;
  gap: 4px;
}

@media (max-width: 480px) {
  .panel {
    padding: 20px;
  }
}
</style>
