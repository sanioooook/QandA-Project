<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useErrors } from '@/composables/useErrors';
import { LIMITS, LOGIN_PATTERN } from '@/limits';
import { safeRedirect } from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useToastsStore } from '@/stores/toasts';

const props = defineProps<{ mode: 'login' | 'register' }>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toasts = useToastsStore();
const { codeMessage, errorMessage, fieldErrors } = useErrors();

const form = reactive({ login: '', password: '', passwordRepeat: '' });
const errors = ref<Record<string, string>>({});
const formError = ref('');
const submitting = ref(false);
const showPassword = ref(false);

const isRegister = computed(() => props.mode === 'register');
const redirect = computed(() => safeRedirect(route.query.redirect));
const otherMode = computed(() => ({
  name: isRegister.value ? 'login' : 'register',
  query: redirect.value ? { redirect: redirect.value } : {},
}));

watch(() => props.mode, () => {
  errors.value = {};
  formError.value = '';
});

/** Same rules as the API, so most mistakes are shown without a round trip. */
function validate(): Record<string, string> {
  const result: Record<string, string> = {};
  const login = form.login.trim();
  if (!isRegister.value) {
    if (!login) result.login = t('errors.required');
    if (!form.password) result.password = t('errors.required');
    return result;
  }
  if (login.length < LIMITS.loginMin || login.length > LIMITS.loginMax) result.login = codeMessage('login_length');
  else if (!LOGIN_PATTERN.test(login)) result.login = codeMessage('login_chars');

  if (form.password.length < LIMITS.passwordMin || form.password.length > LIMITS.passwordMax) result.password = codeMessage('password_length');
  else if (!/\p{L}/u.test(form.password) || !/\d/.test(form.password)) result.password = codeMessage('password_weak');
  else if (form.password.toLowerCase() === login.toLowerCase()) result.password = codeMessage('password_equals_login');

  if (form.passwordRepeat !== form.password) result.passwordRepeat = t('auth.passwordsMismatch');
  return result;
}

async function submit() {
  formError.value = '';
  errors.value = validate();
  if (Object.keys(errors.value).length > 0) return;

  submitting.value = true;
  try {
    const credentials = { login: form.login.trim(), password: form.password };
    const user = isRegister.value ? await auth.register(credentials) : await auth.login(credentials);
    toasts.success(t('toast.welcome', { login: user.login }));
    await router.replace(redirect.value ?? { name: 'active' });
  } catch (error) {
    errors.value = fieldErrors(error);
    if (Object.keys(errors.value).length === 0) formError.value = errorMessage(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="auth">
    <div class="intro">
      <img src="/favicon.svg" alt="" width="48" height="48" />
      <p class="muted">{{ t('app.tagline') }}</p>
    </div>

    <form class="card panel" novalidate @submit.prevent="submit">
      <div class="head">
        <h1>{{ isRegister ? t('auth.registerTitle') : t('auth.loginTitle') }}</h1>
        <p class="muted">{{ isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle') }}</p>
      </div>

      <p v-if="redirect && redirect.startsWith('/surveys/')" class="alert alert-info">{{ t('auth.redirectNotice') }}</p>
      <p v-if="formError" class="alert alert-error" role="alert">{{ formError }}</p>

      <div class="field">
        <label for="login">{{ t('auth.login') }}</label>
        <input
          id="login"
          v-model="form.login"
          class="input"
          name="username"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          :maxlength="LIMITS.loginMax"
          :aria-invalid="!!errors.login"
          :aria-describedby="errors.login ? 'login-error' : isRegister ? 'login-hint' : undefined"
          autofocus
        />
        <p v-if="errors.login" id="login-error" class="error-text">{{ errors.login }}</p>
        <p v-else-if="isRegister" id="login-hint" class="hint">{{ t('auth.loginHint', { min: LIMITS.loginMin, max: LIMITS.loginMax }) }}</p>
      </div>

      <div class="field">
        <label for="password">{{ t('auth.password') }}</label>
        <div class="password">
          <input
            id="password"
            v-model="form.password"
            class="input"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            :maxlength="LIMITS.passwordMax"
            :aria-invalid="!!errors.password"
            :aria-describedby="errors.password ? 'password-error' : isRegister ? 'password-hint' : undefined"
          />
          <button
            type="button"
            class="icon-btn reveal"
            :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
            :title="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
            @click="showPassword = !showPassword"
          >
            <AppIcon :name="showPassword ? 'eyeOff' : 'eye'" />
          </button>
        </div>
        <p v-if="errors.password" id="password-error" class="error-text">{{ errors.password }}</p>
        <p v-else-if="isRegister" id="password-hint" class="hint">{{ t('auth.passwordHint', { min: LIMITS.passwordMin }) }}</p>
      </div>

      <div v-if="isRegister" class="field">
        <label for="password-repeat">{{ t('auth.passwordRepeat') }}</label>
        <input
          id="password-repeat"
          v-model="form.passwordRepeat"
          class="input"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :aria-invalid="!!errors.passwordRepeat"
        />
        <p v-if="errors.passwordRepeat" class="error-text">{{ errors.passwordRepeat }}</p>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        {{ isRegister ? t('auth.submitRegister') : t('auth.submitLogin') }}
      </button>

      <p class="switch muted">
        {{ isRegister ? t('auth.haveAccount') : t('auth.noAccount') }}
        <RouterLink :to="otherMode">{{ isRegister ? t('nav.login') : t('nav.register') }}</RouterLink>
      </p>
    </form>
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

.head {
  display: grid;
  gap: 4px;
}

.password {
  position: relative;
}

.password .input {
  padding-right: 46px;
}

.reveal {
  position: absolute;
  top: 3px;
  right: 3px;
}

.switch {
  text-align: center;
  font-size: 0.92rem;
}

@media (max-width: 480px) {
  .panel {
    padding: 20px;
  }
}
</style>
