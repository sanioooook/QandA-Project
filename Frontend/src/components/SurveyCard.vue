<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SurveySummary } from '@/api/types';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { useFormat } from '@/composables/useFormat';
import { useNow } from '@/composables/useNow';
import { effectiveStatus } from '@/utils/deadline';

const props = defineProps<{ survey: SurveySummary }>();
const { t } = useI18n();
const { date, relative } = useFormat();
// Refresh "closes in 5 minutes" and flip to closed when the deadline passes while the list is open.
const now = useNow(30_000);
const status = computed(() => effectiveStatus(props.survey.status, props.survey.deadline, now.value));
</script>

<template>
  <RouterLink :to="{ name: 'survey', params: { id: survey.id } }" class="survey-card card">
    <div class="top">
      <StatusBadge :status="status" />
      <span v-if="survey.hasVoted" class="voted"><AppIcon name="check" :size="14" />{{ t('survey.youVoted') }}</span>
    </div>
    <h2 class="title">{{ survey.title }}</h2>
    <p class="meta muted">
      <UserAvatar :name="survey.author.name" :url="survey.author.avatarUrl" :size="20" />
      {{ t('survey.by', { author: survey.author.name }) }} ·
      {{ survey.publishedAt ? t('survey.published', { date: date(survey.publishedAt) }) : t('survey.created', { date: date(survey.createdAt) }) }}
    </p>
    <div class="stats muted">
      <span><AppIcon name="users" :size="15" />{{ t('survey.voters', survey.voterCount) }}</span>
      <span>{{ t('survey.options', survey.optionCount) }}</span>
      <span v-if="survey.deadline" :title="date(survey.deadline)">
        <AppIcon name="clock" :size="15" />
        {{ status === 'closed' ? t('survey.closedAt', { date: date(survey.deadline) }) : t('survey.closesIn', { relative: relative(survey.deadline) }) }}
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.survey-card {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 18px;
  color: var(--text);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.survey-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-lg);
  text-decoration: none;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.voted {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.title {
  font-size: 1.08rem;
  overflow-wrap: anywhere;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  font-size: 0.85rem;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 4px;
  font-size: 0.85rem;
}

.stats span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
