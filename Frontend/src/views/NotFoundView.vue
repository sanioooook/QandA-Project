<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="not-found card">
    <p class="code">404</p>
    <h1>{{ t('notFound.title') }}</h1>
    <p class="muted">{{ t('notFound.text') }}</p>
    <RouterLink :to="{ name: 'active' }" class="btn btn-primary">{{ t('notFound.home') }}</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: 12px;
  max-width: 520px;
  margin: 40px auto;
  padding: 40px 24px;
  text-align: center;
}

.code {
  font-size: 3rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}
</style>
