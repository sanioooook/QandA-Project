<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import type { SurveyDetails, SurveyInput } from '@/api/types';
import AppIcon from '@/components/AppIcon.vue';
import { useErrors } from '@/composables/useErrors';
import { useFormat } from '@/composables/useFormat';
import { LIMITS } from '@/limits';
import { useSurveysStore } from '@/stores/surveys';
import { composeDeadline, splitDeadline, todayInput } from '@/utils/deadline';
import { useToastsStore } from '@/stores/toasts';
import NotFoundView from './NotFoundView.vue';

/** Without an id this is the "new survey" page, with an id it edits a draft. */
const props = defineProps<{ id?: string }>();

const { t } = useI18n();
const router = useRouter();
const store = useSurveysStore();
const toasts = useToastsStore();
const { codeMessage, errorMessage, fieldErrors } = useErrors();
const { date: formatDate } = useFormat();

const form = reactive({
  title: '',
  description: '',
  options: ['', ''],
  deadlineDate: '',
  deadlineTime: '',
  maxVotesPerUser: 1,
  allowParticipantOptions: false,
  maxOptionsPerParticipant: 1,
});
const errors = ref<Record<string, string>>({});
const formError = ref('');
const saving = ref(false);
const notFound = ref(false);
const loaded = ref(!props.id);

const filledOptions = computed(() => form.options.map((o) => o.trim()).filter(Boolean));
const maxVotesLimit = computed(() =>
  form.allowParticipantOptions ? LIMITS.maxVotesPerUserCap : Math.max(1, filledOptions.value.length));

const deadline = computed(() => composeDeadline(form.deadlineDate, form.deadlineTime));

function clearDeadline() {
  form.deadlineDate = '';
  form.deadlineTime = '';
}

function fill(survey: SurveyDetails) {
  form.title = survey.title;
  form.description = survey.description ?? '';
  form.options = survey.options.map((o) => o.text);
  ({ date: form.deadlineDate, time: form.deadlineTime } = splitDeadline(survey.deadline));
  form.maxVotesPerUser = survey.maxVotesPerUser;
  form.allowParticipantOptions = survey.allowParticipantOptions;
  form.maxOptionsPerParticipant = survey.maxOptionsPerParticipant;
}

watch(() => props.id, async (id) => {
  if (!id) return;
  try {
    const survey = await store.fetchSurvey(id);
    if (!survey.isAuthor || survey.status !== 'draft') {
      // Published surveys are read-only: show them instead.
      await router.replace({ name: 'survey', params: { id } });
      return;
    }
    fill(survey);
    loaded.value = true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound.value = true;
    else formError.value = errorMessage(error);
  }
}, { immediate: true });

async function addOption() {
  if (form.options.length >= LIMITS.optionsMax) return;
  form.options.push('');
  await nextTick();
  document.getElementById(`option-${form.options.length - 1}`)?.focus();
}

function removeOption(index: number) {
  form.options.splice(index, 1);
}

function onOptionEnter(index: number) {
  if (index === form.options.length - 1 && form.options[index]?.trim()) void addOption();
  else document.getElementById(`option-${index + 1}`)?.focus();
}

function validate(): Record<string, string> {
  const result: Record<string, string> = {};
  if (!form.title.trim()) result.title = codeMessage('title_required');
  const options = filledOptions.value;
  if (options.length < LIMITS.optionsMin) result.options = codeMessage('options_min');
  else if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) result.options = codeMessage('option_duplicate');
  if (form.maxVotesPerUser < 1 || form.maxVotesPerUser > LIMITS.maxVotesPerUserCap) result.maxVotesPerUser = codeMessage('max_votes_range');
  else if (!form.allowParticipantOptions && form.maxVotesPerUser > options.length) result.maxVotesPerUser = codeMessage('max_votes_exceeds_options');
  if (form.allowParticipantOptions && (form.maxOptionsPerParticipant < 1 || form.maxOptionsPerParticipant > LIMITS.maxOptionsPerParticipantCap)) {
    result.maxOptionsPerParticipant = codeMessage('max_options_range');
  }
  if (deadline.value && deadline.value.getTime() <= Date.now()) result.deadline = codeMessage('deadline_past');
  return result;
}

async function save(publish: boolean) {
  formError.value = '';
  errors.value = validate();
  if (Object.keys(errors.value).length > 0) {
    formError.value = t('errors.validation');
    return;
  }

  const input: SurveyInput = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    options: filledOptions.value,
    deadline: deadline.value?.toISOString() ?? null,
    maxVotesPerUser: form.maxVotesPerUser,
    allowParticipantOptions: form.allowParticipantOptions,
    maxOptionsPerParticipant: form.maxOptionsPerParticipant,
    publish,
  };

  saving.value = true;
  try {
    const survey = props.id ? await store.update(props.id, input) : await store.create(input);
    toasts.success(t(publish ? 'toast.published' : props.id ? 'toast.saved' : 'toast.created'));
    await router.push({ name: 'survey', params: { id: survey.id } });
  } catch (error) {
    errors.value = fieldErrors(error);
    formError.value = errorMessage(error);
  } finally {
    saving.value = false;
  }
}

const minDate = todayInput();
</script>

<template>
  <NotFoundView v-if="notFound" />
  <section v-else class="edit">
    <div class="page-head">
      <h1>{{ id ? t('form.editTitle') : t('form.createTitle') }}</h1>
    </div>

    <form v-if="loaded" class="card form" novalidate @submit.prevent="save(true)">
      <p v-if="formError" class="alert alert-error" role="alert">{{ formError }}</p>

      <div class="field">
        <label for="title">{{ t('form.title') }}</label>
        <input
          id="title"
          v-model="form.title"
          class="input"
          :placeholder="t('form.titlePlaceholder')"
          :maxlength="LIMITS.titleMax"
          :aria-invalid="!!errors.title"
          autofocus
        />
        <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
      </div>

      <div class="field">
        <label for="description">{{ t('form.description') }}</label>
        <textarea
          id="description"
          v-model="form.description"
          class="input"
          :placeholder="t('form.descriptionPlaceholder')"
          :maxlength="LIMITS.descriptionMax"
          :aria-invalid="!!errors.description"
        />
        <p v-if="errors.description" class="error-text">{{ errors.description }}</p>
      </div>

      <fieldset class="field">
        <legend class="label">{{ t('form.options') }}</legend>
        <div v-for="(_, index) in form.options" :key="index" class="option-row">
          <span class="num muted">{{ index + 1 }}</span>
          <input
            :id="`option-${index}`"
            v-model="form.options[index]"
            class="input"
            :placeholder="t('form.optionPlaceholder', { n: index + 1 })"
            :maxlength="LIMITS.optionTextMax"
            :aria-invalid="!!errors.options"
            @keydown.enter.prevent="onOptionEnter(index)"
          />
          <button
            type="button"
            class="icon-btn"
            :disabled="form.options.length <= LIMITS.optionsMin"
            :aria-label="t('form.removeOption', { n: index + 1 })"
            :title="t('form.removeOption', { n: index + 1 })"
            @click="removeOption(index)"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>
        <p v-if="errors.options" class="error-text">{{ errors.options }}</p>
        <button type="button" class="btn btn-sm add" :disabled="form.options.length >= LIMITS.optionsMax" @click="addOption">
          <AppIcon name="plus" :size="15" />{{ t('form.addOption') }}
        </button>
      </fieldset>

      <fieldset class="settings">
        <legend class="label">{{ t('form.settings') }}</legend>

        <div class="grid">
          <div class="field">
            <label for="max-votes">{{ t('form.maxVotes') }}</label>
            <input
              id="max-votes"
              v-model.number="form.maxVotesPerUser"
              class="input"
              type="number"
              min="1"
              :max="maxVotesLimit"
              :aria-invalid="!!errors.maxVotesPerUser"
            />
            <p v-if="errors.maxVotesPerUser" class="error-text">{{ errors.maxVotesPerUser }}</p>
          </div>

          <div class="field">
            <label for="deadline">{{ t('form.deadline') }}</label>
            <div class="deadline-row">
              <input
                id="deadline"
                v-model="form.deadlineDate"
                class="input"
                type="date"
                :min="minDate"
                :aria-invalid="!!errors.deadline"
              />
              <input
                v-model="form.deadlineTime"
                class="input time"
                type="time"
                step="60"
                :disabled="!form.deadlineDate"
                :aria-label="t('form.deadlineTime')"
                :title="t('form.deadlineTime')"
              />
              <button
                v-if="form.deadlineDate || form.deadlineTime"
                type="button"
                class="icon-btn"
                :aria-label="t('form.clearDeadline')"
                :title="t('form.clearDeadline')"
                @click="clearDeadline"
              >
                <AppIcon name="x" :size="16" />
              </button>
            </div>
            <p v-if="errors.deadline" class="error-text">{{ errors.deadline }}</p>
            <p v-else-if="deadline" class="hint">{{ t('form.deadlineSummary', { date: formatDate(deadline.toISOString()) }) }}</p>
            <p v-else class="hint">{{ t('form.deadlineHint') }}</p>
          </div>
        </div>

        <label class="check">
          <input v-model="form.allowParticipantOptions" type="checkbox" />
          <span>{{ t('form.allowOptions') }}</span>
        </label>

        <div v-if="form.allowParticipantOptions" class="field narrow">
          <label for="max-options">{{ t('form.maxOptions') }}</label>
          <input
            id="max-options"
            v-model.number="form.maxOptionsPerParticipant"
            class="input"
            type="number"
            min="1"
            :max="LIMITS.maxOptionsPerParticipantCap"
            :aria-invalid="!!errors.maxOptionsPerParticipant"
          />
          <p v-if="errors.maxOptionsPerParticipant" class="error-text">{{ errors.maxOptionsPerParticipant }}</p>
        </div>
      </fieldset>

      <div class="footer">
        <p class="hint">{{ t('form.publishHint') }}</p>
        <div class="buttons">
          <button type="button" class="btn btn-ghost" @click="router.back()">{{ t('form.cancel') }}</button>
          <button type="button" class="btn" :disabled="saving" @click="save(false)">{{ id ? t('form.saveChanges') : t('form.saveDraft') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <AppIcon name="send" :size="16" />{{ t('form.publish') }}
          </button>
        </div>
      </div>
    </form>
    <div v-else class="skeleton" style="height: 420px" />
  </section>
</template>

<style scoped>
.edit {
  max-width: 760px;
  margin: 0 auto;
}

.form {
  display: grid;
  gap: 22px;
  padding: clamp(18px, 3vw, 28px);
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.num {
  width: 20px;
  flex: none;
  text-align: right;
  font-size: 0.85rem;
}

.add {
  justify-self: start;
  margin-left: 28px;
}

.settings {
  display: grid;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.settings legend {
  float: left;
  width: 100%;
  margin-bottom: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 16px;
}

.deadline-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.deadline-row .input {
  min-width: 0;
}

.deadline-row .time {
  flex: 0 0 120px;
}

.narrow {
  max-width: 280px;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 480px) {
  .buttons,
  .buttons .btn {
    width: 100%;
  }
}
</style>
