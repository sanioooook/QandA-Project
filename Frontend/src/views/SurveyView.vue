<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import type { SurveyOption } from '@/api/types';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useErrors } from '@/composables/useErrors';
import { useFormat } from '@/composables/useFormat';
import { useNow } from '@/composables/useNow';
import { LIMITS } from '@/limits';
import { useSurveysStore } from '@/stores/surveys';
import { useAuthStore } from '@/stores/auth';
import { useToastsStore } from '@/stores/toasts';
import { clock, effectiveStatus, remaining } from '@/utils/deadline';
import ShareDialog from '@/components/ShareDialog.vue';
import NotFoundView from './NotFoundView.vue';

const props = defineProps<{ id: string }>();

const { t } = useI18n();
const router = useRouter();
const store = useSurveysStore();
const auth = useAuthStore();
const toasts = useToastsStore();
const { errorMessage, fieldErrors } = useErrors();
const { date } = useFormat();

const survey = computed(() => store.getSurvey(props.id));
const notFound = ref(false);
const loadError = ref('');
const busy = ref(false);

async function load() {
  notFound.value = false;
  loadError.value = '';
  try {
    await store.fetchSurvey(props.id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound.value = true;
    else loadError.value = errorMessage(error);
  }
}
watch(() => props.id, load, { immediate: true });

// --- deadline -----------------------------------------------------------
const now = useNow(1000);
const status = computed(() => (survey.value ? effectiveStatus(survey.value.status, survey.value.deadline, now.value) : 'draft'));
const canVote = computed(() => !!survey.value?.canVote && status.value === 'active');
const canAddOption = computed(() => !!survey.value?.canAddOption && status.value === 'active');
const left = computed(() => (survey.value?.deadline && status.value === 'active' ? remaining(survey.value.deadline, now.value) : null));
const countdown = computed(() =>
  left.value ? [left.value.days > 0 ? t('survey.days', left.value.days) : '', clock(left.value)].filter(Boolean).join(' ') : '');

// The deadline passed while the page is open: voting is locked at once, then the server's view is loaded.
watch(status, (next, previous) => {
  if (previous === 'active' && next === 'closed') {
    store.invalidateLists(['active']);
    void store.fetchSurvey(props.id, { force: true }).catch(() => {});
  }
});

// --- voting -------------------------------------------------------------
const selection = ref<number[]>([]);
watch(() => survey.value?.myVotes, (votes) => { selection.value = [...(votes ?? [])]; }, { immediate: true });

const single = computed(() => survey.value?.maxVotesPerUser === 1);
const atLimit = computed(() => !!survey.value && selection.value.length >= survey.value.maxVotesPerUser);
const hasVoted = computed(() => (survey.value?.myVotes.length ?? 0) > 0);
const dirty = computed(() => {
  const mine = [...(survey.value?.myVotes ?? [])].sort();
  const current = [...selection.value].sort();
  return mine.length !== current.length || mine.some((id, i) => id !== current[i]);
});

function toggle(option: SurveyOption) {
  if (!canVote.value) return;
  if (single.value) {
    selection.value = [option.id];
    return;
  }
  selection.value = selection.value.includes(option.id)
    ? selection.value.filter((id) => id !== option.id)
    : atLimit.value ? selection.value : [...selection.value, option.id];
}

async function run<T>(action: () => Promise<T>, success?: string): Promise<T | undefined> {
  busy.value = true;
  try {
    const result = await action();
    if (success) toasts.success(success);
    return result;
  } catch (error) {
    toasts.error(errorMessage(error));
    // The survey may have changed under us (closed, option removed): show the current state.
    if (error instanceof ApiError && error.status === 409) await store.fetchSurvey(props.id, { force: true }).catch(() => {});
    return undefined;
  } finally {
    busy.value = false;
  }
}

const submitVote = () => run(() => store.vote(props.id, selection.value), t(selection.value.length ? 'toast.voted' : 'toast.voteWithdrawn'));
const withdraw = () => run(() => store.vote(props.id, []), t('toast.voteWithdrawn'));

const percent = (option: SurveyOption) =>
  survey.value && survey.value.totalVotes > 0 ? Math.round((option.votes / survey.value.totalVotes) * 100) : 0;

// --- new option ---------------------------------------------------------
const newOption = ref('');
const newOptionVote = ref(false);
const newOptionError = ref('');
const optionsLeft = computed(() => (survey.value ? survey.value.maxOptionsPerParticipant - survey.value.myAddedOptions : 0));
const canVoteForNew = computed(() => !!survey.value && survey.value.myVotes.length < survey.value.maxVotesPerUser);

async function addOption() {
  newOptionError.value = '';
  const text = newOption.value.trim();
  if (!text) return;
  busy.value = true;
  try {
    await store.addOption(props.id, text, newOptionVote.value && canVoteForNew.value);
    newOption.value = '';
    newOptionVote.value = false;
    toasts.success(t('toast.optionAdded'));
  } catch (error) {
    newOptionError.value = fieldErrors(error).text ?? errorMessage(error);
  } finally {
    busy.value = false;
  }
}

// --- author actions -----------------------------------------------------
// The share link uses the address the app was opened from, so it works on any host without configuration.
const shareUrl = computed(() => `${window.location.origin}/surveys/${props.id}`);

const publish = () => run(() => store.publish(props.id), t('toast.published'));

async function remove() {
  if (!window.confirm(t('survey.confirmDelete'))) return;
  const done = await run(async () => { await store.remove(props.id); return true; }, t('toast.deleted'));
  if (done) await router.replace({ name: 'mine' });
}
</script>

<template>
  <NotFoundView v-if="notFound" />
  <p v-else-if="loadError" class="alert alert-error" role="alert">{{ loadError }}</p>
  <div v-else-if="!survey" class="layout" aria-busy="true">
    <div class="skeleton" style="height: 320px" />
  </div>

  <div v-else class="layout">
    <article class="main card">
      <header class="head">
        <ShareDialog v-if="survey.status !== 'draft'" class="share" :url="shareUrl" :title="survey.title" />
        <div class="badges">
          <StatusBadge :status="status" />
          <span v-if="survey.deadline" class="deadline muted" :title="date(survey.deadline)">
            <AppIcon name="clock" :size="15" />
            {{ status === 'closed' ? t('survey.closedAt', { date: date(survey.deadline) }) : date(survey.deadline) }}
          </span>
        </div>
        <h1 class="title">{{ survey.title }}</h1>
        <p v-if="survey.description" class="description">{{ survey.description }}</p>
        <p class="meta muted">
          {{ t('survey.by', { author: survey.author.name }) }} ·
          {{ survey.publishedAt ? t('survey.published', { date: date(survey.publishedAt) }) : t('survey.created', { date: date(survey.createdAt) }) }}
        </p>
      </header>

      <div v-if="left" class="countdown" :class="{ soon: left.totalMs < 3_600_000 }" role="timer" aria-live="off">
        <span class="countdown-label">{{ t('survey.timeLeft') }}</span>
        <span class="countdown-value">{{ countdown }}</span>
      </div>

      <p v-if="status === 'draft'" class="alert alert-warning">{{ t('survey.draftNotice') }}</p>
      <p v-else-if="status === 'closed'" class="alert alert-info">{{ t('survey.closedNotice') }}</p>

      <div class="vote">
        <div v-if="canVote" class="vote-head">
          <span class="label">{{ single ? t('survey.chooseOne') : t('survey.chooseUpTo', { n: survey.maxVotesPerUser }) }}</span>
          <span v-if="!single" class="muted small">{{ t('survey.selected', { n: selection.length, max: survey.maxVotesPerUser }) }}</span>
        </div>

        <ul class="options" :role="single ? 'radiogroup' : 'group'" :aria-label="survey.title">
          <li v-for="option in survey.options" :key="option.id">
            <label
              class="option"
              :class="{
                selected: selection.includes(option.id),
                mine: survey.myVotes.includes(option.id),
                disabled: !canVote || (!selection.includes(option.id) && atLimit && !single),
              }"
            >
              <span class="bar" :style="{ width: `${percent(option)}%` }" aria-hidden="true" />
              <input
                :type="single ? 'radio' : 'checkbox'"
                :name="`survey-${survey.id}`"
                :checked="selection.includes(option.id)"
                :disabled="!canVote || busy || (!selection.includes(option.id) && atLimit && !single)"
                @change="toggle(option)"
              />
              <span class="text">
                {{ option.text }}
                <small v-if="option.addedBy" class="muted">{{ t('survey.addedBy', { name: option.addedBy }) }}</small>
              </span>
              <span class="result">
                <strong>{{ percent(option) }}%</strong>
                <small class="muted">{{ t('survey.votes', option.votes) }}</small>
              </span>
            </label>

            <details v-if="survey.isAuthor && option.voters?.length" class="voters">
              <summary>{{ t('survey.votersTitle') }} ({{ option.voters.length }})</summary>
              <ul>
                <li v-for="voter in option.voters" :key="voter.userId">
                  <span>{{ voter.name }}</span>
                  <time class="muted" :datetime="voter.votedAt">{{ date(voter.votedAt) }}</time>
                </li>
              </ul>
            </details>
          </li>
        </ul>

        <div class="totals muted">
          <span><AppIcon name="users" :size="15" />{{ t('survey.voters', survey.voterCount) }}</span>
          <span>{{ t('survey.totalVotes') }}: {{ t('survey.votes', survey.totalVotes) }}</span>
          <span v-if="survey.isAuthor && survey.status !== 'draft'">{{ t('survey.authorOnly') }}</span>
        </div>

        <div v-if="status === 'active' && !auth.isLoggedIn" class="cta">
          <span>{{ t('survey.signInToVote') }}</span>
          <RouterLink :to="{ name: 'login', query: { redirect: `/surveys/${survey.id}` } }" class="btn btn-primary btn-sm">{{ t('nav.login') }}</RouterLink>
          <RouterLink :to="{ name: 'register', query: { redirect: `/surveys/${survey.id}` } }" class="btn btn-sm">{{ t('nav.register') }}</RouterLink>
        </div>
        <p v-else-if="status === 'active' && auth.needsConfirmation" class="alert alert-warning">{{ t('survey.confirmToVote') }}</p>

        <div v-if="canVote" class="vote-actions">
          <button type="button" class="btn btn-primary" :disabled="busy || !dirty || selection.length === 0" @click="submitVote">
            <AppIcon name="check" :size="16" />
            {{ hasVoted ? t('survey.updateVote') : t('survey.submitVote') }}
          </button>
          <button v-if="hasVoted" type="button" class="btn btn-ghost" :disabled="busy" @click="withdraw">{{ t('survey.withdraw') }}</button>
        </div>
      </div>

      <form v-if="canAddOption" class="add-option" @submit.prevent="addOption">
        <label class="label" for="new-option">{{ t('survey.addOption') }}</label>
        <div class="add-row">
          <input
            id="new-option"
            v-model="newOption"
            class="input"
            :placeholder="t('survey.addOptionPlaceholder')"
            :maxlength="LIMITS.optionTextMax"
            :aria-invalid="!!newOptionError"
          />
          <button type="submit" class="btn" :disabled="busy || !newOption.trim()">
            <AppIcon name="plus" :size="16" />{{ t('survey.add') }}
          </button>
        </div>
        <p v-if="newOptionError" class="error-text">{{ newOptionError }}</p>
        <div class="add-meta">
          <label v-if="canVoteForNew" class="check small">
            <input v-model="newOptionVote" type="checkbox" />
            <span>{{ t('survey.addAndVote') }}</span>
          </label>
          <span v-if="!survey.isAuthor" class="muted small">{{ t('survey.optionsLeft', optionsLeft) }}</span>
        </div>
      </form>
    </article>

    <aside v-if="survey.isAuthor" class="side">
      <div class="card panel">
        <button v-if="survey.status === 'draft'" type="button" class="btn btn-primary btn-block" :disabled="busy" @click="publish">
          <AppIcon name="send" :size="16" />{{ t('survey.publish') }}
        </button>
        <RouterLink v-if="survey.status === 'draft'" :to="{ name: 'edit', params: { id: survey.id } }" class="btn btn-block">
          <AppIcon name="edit" :size="16" />{{ t('survey.edit') }}
        </RouterLink>
        <button type="button" class="btn btn-danger btn-block" :disabled="busy" @click="remove">
          <AppIcon name="trash" :size="16" />{{ t('survey.delete') }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

@media (min-width: 880px) {
  .layout:has(.side) {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

.main {
  display: grid;
  gap: 20px;
  padding: clamp(18px, 3vw, 28px);
}

.head {
  position: relative;
  display: grid;
  gap: 8px;
}

/* Share icon in the top-right corner; the badges row leaves room for it. */
.head :deep(.share-btn) {
  position: absolute;
  top: -6px;
  right: -6px;
}

.badges {
  padding-right: 40px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}

.deadline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.88rem;
}

.title {
  overflow-wrap: anywhere;
}

.description {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.meta,
.small {
  font-size: 0.86rem;
}

.countdown {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
}

.countdown.soon {
  background: var(--warning-soft);
}

.countdown-label {
  font-weight: 600;
}

.countdown-value {
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.vote {
  display: grid;
  gap: 12px;
}

.vote-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
}

.options {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 10px 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.15s;
}

.option:hover:not(.disabled) {
  border-color: var(--primary);
}

.option.selected {
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary);
}

.option.disabled {
  cursor: default;
}

.bar {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--primary-soft);
  transition: width 0.4s ease;
}

.option.mine .bar {
  background: color-mix(in srgb, var(--bar) 70%, transparent);
}

.option > :not(.bar) {
  position: relative;
}

.option input {
  width: 18px;
  height: 18px;
  margin: 0;
  flex: none;
  accent-color: var(--primary);
}

.text {
  display: grid;
  flex: 1;
  overflow-wrap: anywhere;
  font-weight: 500;
}

.result {
  display: grid;
  justify-items: end;
  flex: none;
  line-height: 1.2;
}

.voters {
  margin: 6px 0 0 14px;
  font-size: 0.88rem;
}

.voters summary {
  color: var(--text-muted);
  cursor: pointer;
}

.voters ul {
  display: grid;
  gap: 4px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}

.voters li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--surface-2);
}

.totals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 0.88rem;
}

.totals span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
}

.cta span {
  margin-right: auto;
  font-weight: 600;
}

.vote-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-option {
  display: grid;
  gap: 8px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.add-row {
  display: flex;
  gap: 8px;
}

.add-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.side {
  display: grid;
  gap: 16px;
}

.panel {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.panel h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

@media (max-width: 480px) {
  .add-row {
    flex-direction: column;
  }
}
</style>
