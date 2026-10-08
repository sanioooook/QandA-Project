<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/AppIcon.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { useErrors } from '@/composables/useErrors';
import { LOCALE_NAMES, LOCALES } from '@/i18n';
import { LIMITS } from '@/limits';
import { useAuthStore } from '@/stores/auth';
import { usePrefsStore, type Theme } from '@/stores/prefs';
import { useToastsStore } from '@/stores/toasts';
import { displayNameError } from '@/utils/accountRules';
import { toSquareImage } from '@/utils/image';
import { allTimeZones, browserTimeZone, zoneName } from '@/utils/timeZone';

const { t } = useI18n();
const auth = useAuthStore();
const toasts = useToastsStore();
const { user, config } = storeToRefs(auth);
const { theme, locale, timeZone } = storeToRefs(usePrefsStore());
const zoneOptions = computed(() => allTimeZones().map((zone) => ({ zone, label: zoneName(zone) })));
const autoZoneLabel = computed(() => zoneName(browserTimeZone()));
const { codeMessage, errorMessage, fieldErrors } = useErrors();

// --- avatar ---------------------------------------------------------------
const fileInput = ref<HTMLInputElement | null>(null);
const avatarBusy = ref(false);
const avatarError = ref('');

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (!file) return;
  avatarError.value = '';
  avatarBusy.value = true;
  try {
    // Cropped and compressed in the browser: the server only stores a small square image.
    await auth.uploadAvatar(await toSquareImage(file));
    toasts.success(t('account.avatarSaved'));
  } catch (error) {
    avatarError.value = error instanceof Error && error.name !== 'ApiError' ? t('account.avatarUnreadable') : errorMessage(error);
  } finally {
    avatarBusy.value = false;
  }
}

async function removeAvatar() {
  avatarBusy.value = true;
  try {
    await auth.removeAvatar();
    toasts.success(t('account.avatarRemoved'));
  } catch (error) {
    toasts.error(errorMessage(error));
  } finally {
    avatarBusy.value = false;
  }
}

// --- name -------------------------------------------------------------------
const name = ref(user.value?.displayName ?? '');
const nameError = ref('');
const nameBusy = ref(false);
watch(() => user.value?.displayName, (value) => { name.value = value ?? ''; });

async function saveName() {
  const code = displayNameError(name.value);
  nameError.value = code ? codeMessage(code) : '';
  if (code) return;
  nameBusy.value = true;
  try {
    await auth.updateProfile({ displayName: name.value.trim() });
    toasts.success(t('toast.saved'));
  } catch (error) {
    nameError.value = fieldErrors(error).displayName ?? errorMessage(error);
  } finally {
    nameBusy.value = false;
  }
}

// --- email ------------------------------------------------------------------
const resendBusy = ref(false);
async function resend() {
  resendBusy.value = true;
  try {
    await auth.resendConfirmation();
    toasts.success(t('toast.confirmationSent'));
  } catch (error) {
    toasts.error(errorMessage(error));
  } finally {
    resendBusy.value = false;
  }
}

const themes: Theme[] = ['light', 'dark', 'system'];
</script>

<template>
  <section v-if="user" class="account">
    <div class="page-head">
      <h1>{{ t('account.title') }}</h1>
    </div>

    <div class="card section">
      <h2>{{ t('account.profile') }}</h2>
      <div class="avatar-row">
        <UserAvatar :name="user.displayName" :url="user.avatarUrl" :size="88" />
        <div class="avatar-actions">
          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onFile" />
          <button type="button" class="btn btn-sm" :disabled="avatarBusy" @click="fileInput?.click()">
            <AppIcon name="camera" :size="16" />{{ user.avatarUrl ? t('account.changeAvatar') : t('account.uploadAvatar') }}
          </button>
          <button v-if="user.avatarUrl" type="button" class="btn btn-sm btn-danger" :disabled="avatarBusy" @click="removeAvatar">
            <AppIcon name="trash" :size="16" />{{ t('account.removeAvatar') }}
          </button>
          <p class="hint">{{ t('account.avatarHint') }}</p>
          <p v-if="avatarError" class="error-text">{{ avatarError }}</p>
        </div>
      </div>

      <form class="field name" novalidate @submit.prevent="saveName">
        <label for="display-name">{{ t('auth.displayName') }}</label>
        <div class="row">
          <input id="display-name" v-model="name" class="input" :maxlength="LIMITS.displayNameMax" :aria-invalid="!!nameError" />
          <button type="submit" class="btn" :disabled="nameBusy || name.trim() === user.displayName">{{ t('account.save') }}</button>
        </div>
        <p v-if="nameError" class="error-text">{{ nameError }}</p>
        <p v-else class="hint">{{ t('auth.displayNameHint') }}</p>
      </form>
    </div>

    <div class="card section">
      <h2>{{ t('account.security') }}</h2>
      <div class="line">
        <div>
          <div class="label">{{ t('auth.email') }}</div>
          <div class="email">
            {{ user.email }}
            <span v-if="config.emailEnabled" class="badge" :class="user.emailConfirmed ? 'ok' : 'warn'">
              {{ user.emailConfirmed ? t('account.confirmed') : t('account.notConfirmed') }}
            </span>
          </div>
        </div>
        <button v-if="config.emailEnabled && !user.emailConfirmed" type="button" class="btn btn-sm" :disabled="resendBusy" @click="resend">
          {{ t('auth.resend') }}
        </button>
      </div>
      <div class="line">
        <div>
          <div class="label">{{ t('auth.password') }}</div>
          <div class="muted">••••••••</div>
        </div>
        <RouterLink :to="{ name: 'change-password' }" class="btn btn-sm"><AppIcon name="key" :size="16" />{{ t('menu.changePassword') }}</RouterLink>
      </div>
    </div>

    <div class="card section">
      <h2>{{ t('account.interface') }}</h2>
      <div class="field">
        <span class="label">{{ t('prefs.language') }}</span>
        <div class="choices" role="radiogroup" :aria-label="t('prefs.language')">
          <label v-for="code in LOCALES" :key="code" class="choice" :class="{ active: locale === code }">
            <input v-model="locale" type="radio" name="locale" :value="code" />{{ LOCALE_NAMES[code] }}
          </label>
        </div>
        <p class="hint">{{ t('account.languageHint') }}</p>
      </div>
      <div class="field">
        <label class="label" for="time-zone">{{ t('prefs.timeZone') }}</label>
        <select id="time-zone" v-model="timeZone" class="input zone">
          <option value="auto">{{ t('prefs.timeZoneAuto', { zone: autoZoneLabel }) }}</option>
          <option v-for="option in zoneOptions" :key="option.zone" :value="option.zone">{{ option.label }}</option>
        </select>
        <p class="hint">{{ t('account.timeZoneHint') }}</p>
      </div>
      <div class="field">
        <span class="label">{{ t('prefs.theme') }}</span>
        <div class="choices" role="radiogroup" :aria-label="t('prefs.theme')">
          <label v-for="value in themes" :key="value" class="choice" :class="{ active: theme === value }">
            <input v-model="theme" type="radio" name="theme" :value="value" />
            <AppIcon :name="value === 'light' ? 'sun' : value === 'dark' ? 'moon' : 'monitor'" :size="16" />{{ t(`prefs.${value}`) }}
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account {
  display: grid;
  gap: 16px;
  max-width: 680px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: 4px;
}

.section {
  display: grid;
  gap: 18px;
  padding: clamp(18px, 3vw, 24px);
}

.avatar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.avatar-actions .hint,
.avatar-actions .error-text {
  width: 100%;
}

.row {
  display: flex;
  gap: 8px;
}

.line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.line:first-of-type {
  padding-top: 0;
  border-top: 0;
}

.email {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  overflow-wrap: anywhere;
}

.badge {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge.ok {
  background: var(--success-soft);
  color: var(--success);
}

.badge.warn {
  background: var(--warning-soft);
  color: var(--warning);
}

.zone {
  max-width: 420px;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.choice:has(input:focus-visible) {
  box-shadow: var(--focus);
}

.choice.active {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

@media (max-width: 480px) {
  .row {
    flex-direction: column;
  }
}
</style>
