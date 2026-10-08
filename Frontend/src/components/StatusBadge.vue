<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { SurveyStatus } from '@/api/types';

defineProps<{ status: SurveyStatus }>();
const { t } = useI18n();
</script>

<template>
  <span class="badge" :class="status">{{ t(`survey.status.${status}`) }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.active {
  background: var(--success-soft);
  color: var(--success);
}

.draft {
  background: var(--warning-soft);
  color: var(--warning);
}

.closed {
  background: var(--surface-2);
  color: var(--text-muted);
}
</style>
