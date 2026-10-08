<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { ListQuery } from '@/api';
import type { SurveyScope, SurveyStatus } from '@/api/types';
import AppIcon from '@/components/AppIcon.vue';
import EmptyState from '@/components/EmptyState.vue';
import SurveyCard from '@/components/SurveyCard.vue';
import SurveyCardSkeleton from '@/components/skeletons/SurveyCardSkeleton.vue';
import { useErrors } from '@/composables/useErrors';
import { useSurveysStore } from '@/stores/surveys';

const PAGE_SIZE = 12;
const STATUSES: SurveyStatus[] = ['draft', 'active', 'closed'];

const props = defineProps<{ scope: SurveyScope }>();

const { t } = useI18n();
const route = useRoute();
const store = useSurveysStore();
const { errorMessage } = useErrors();

const status = computed<SurveyStatus | null>(() => {
  const value = route.query.status;
  return props.scope === 'mine' && STATUSES.includes(value as SurveyStatus) ? (value as SurveyStatus) : null;
});
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const query = computed<ListQuery>(() => ({ scope: props.scope, status: status.value, page: page.value, pageSize: PAGE_SIZE }));

// Cached data is shown at once; fetchList only hits the network when the cache is stale.
const data = computed(() => store.getList(query.value));
const pages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)));
const loading = ref(false);
const error = ref('');

const titles = computed(() => ({
  title: t(`list.${props.scope}Title`),
  subtitle: t(`list.${props.scope}Subtitle`),
  empty: status.value ? t('list.emptyFiltered') : t(`list.empty${props.scope.charAt(0).toUpperCase()}${props.scope.slice(1)}`),
}));

async function load(force = false) {
  loading.value = true;
  error.value = '';
  try {
    await store.fetchList(query.value, { force });
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

watch(query, () => load(), { immediate: true });

const filterLink = (value: SurveyStatus | null) => ({ query: value ? { status: value } : {} });
const pageLink = (value: number) => ({ query: { ...route.query, page: value > 1 ? String(value) : undefined } });
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h1>{{ titles.title }}</h1>
        <p class="muted">{{ titles.subtitle }}</p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn btn-sm" :disabled="loading" @click="load(true)">
          <AppIcon name="refresh" :size="15" :class="{ spin: loading }" />
          {{ t('list.refresh') }}
        </button>
        <RouterLink v-if="scope !== 'voted'" :to="{ name: 'create' }" class="btn btn-primary btn-sm">
          <AppIcon name="plus" :size="15" />
          {{ t('nav.newSurvey') }}
        </RouterLink>
      </div>
    </div>

    <nav v-if="scope === 'mine'" class="filters" :aria-label="t('list.filterAll')">
      <RouterLink :to="filterLink(null)" class="chip" :class="{ active: !status }">{{ t('list.filterAll') }}</RouterLink>
      <RouterLink v-for="value in STATUSES" :key="value" :to="filterLink(value)" class="chip" :class="{ active: status === value }">
        {{ t(`survey.status.${value}`) }}
      </RouterLink>
    </nav>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <div v-if="!data && loading" class="grid" aria-busy="true">
      <span class="sr-only">{{ t('common.loading') }}</span>
      <SurveyCardSkeleton v-for="i in 6" :key="i" />
    </div>
    <EmptyState v-else-if="data && data.items.length === 0" :text="titles.empty">
      <RouterLink v-if="scope !== 'voted'" :to="{ name: 'create' }" class="btn btn-primary">{{ t('nav.newSurvey') }}</RouterLink>
      <RouterLink v-else :to="{ name: 'active' }" class="btn">{{ t('nav.active') }}</RouterLink>
    </EmptyState>
    <template v-else-if="data">
      <div class="grid">
        <SurveyCard v-for="survey in data.items" :key="survey.id" :survey="survey" />
      </div>
      <nav v-if="pages > 1" class="pager">
        <RouterLink v-if="page > 1" :to="pageLink(page - 1)" class="btn btn-sm"><AppIcon name="left" :size="15" />{{ t('list.prev') }}</RouterLink>
        <span class="muted">{{ t('list.page', { page, pages }) }}</span>
        <RouterLink v-if="page < pages" :to="pageLink(page + 1)" class="btn btn-sm">{{ t('list.next') }}<AppIcon name="right" :size="15" /></RouterLink>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.chip {
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.88rem;
}

.chip:hover {
  color: var(--text);
  text-decoration: none;
}

.chip.active {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.alert {
  margin-bottom: 16px;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
