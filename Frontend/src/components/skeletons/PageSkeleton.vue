<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SurveyCardSkeleton from './SurveyCardSkeleton.vue';

const { t } = useI18n();
</script>

<template>
  <section aria-busy="true">
    <span class="sr-only">{{ t('common.loading') }}</span>
    <div class="head" aria-hidden="true">
      <span class="skeleton title" />
      <span class="skeleton line" />
    </div>
    <div class="grid">
      <SurveyCardSkeleton v-for="i in 3" :key="i" />
    </div>
  </section>
</template>

<style scoped>
.head {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.title {
  width: 240px;
  height: 28px;
}

.line {
  width: min(360px, 80%);
  height: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}
</style>
