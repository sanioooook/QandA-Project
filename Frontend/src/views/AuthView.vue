<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import PasswordField from '@/components/PasswordField.vue';
import { useErrors } from '@/composables/useErrors';
import { LIMITS } from '@/limits';
import { safeRedirect } from '@/router';
import { useAuthStore } from '@/stores/auth';
import { usePrefsStore } from '@/stores/prefs';
import { useToastsStore } from '@/stores/toasts';
import { displayNameError, emailError, passwordError } from '@/utils/accountRules';

const props = defineProps<{ mode: 'login' | 'register' }>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const prefs = usePrefsStore();
const toasts = useToastsStore();
const { codeMessage, errorMessage, fieldErrors } = useErrors();

const form = reactive({ email: '', displayName: '', password: '', passwordRepeat: '' });
const errors = ref<Record<string, string>>({});
const formError = ref('');
const submitting = ref(false);

const isRegister = computed(() => props.mode === 'register');
const redirect = computed(() => safeRedirect(route.query.redirect));
const withRedirect = (name: string) => ({ name, query: redirect.value ? { redirect: redirect.value } : {} });

watch(() => props.mode, () => {
  errors.value = {};
  formError.value = '';
});

/** Same rules as the API, so most mistakes are shown without a round trip. */
function validate(): Record<string, string> {
  const result: Record<string, string> = {};
  if (!isRegister.value) {
    if (!form.email.trim()) result.email = t('errors.required');
    if (!form.password) result.password = t('errors.required');
    return result;
  }
  const checks: [string, string | null][] = [
    ['email', emailError(form.email)],
    ['displayName', displayNameError(form.displayName)],
    ['password', passwordError(form.password, form.email)],
  ];
  for (const [field, code] of checks) if (code) result[field] = codeMessage(code);
  if (form.passwordRepeat !== form.password) result.passwordRepeat = t('auth.passwordsMismatch');
  return result;
}

async function submit() {
  formError.value = '';
  errors.value = validate();
  if (Object.keys(errors.value).length > 0) return;

  submitting.value = true;
  try {
    const email = form.email.trim();
    const user = isRegister.value
      ? await auth.register({ email, displayName: form.displayName.trim(), password: form.password, locale: prefs.locale })
      : await auth.login({ email, password: form.password });
    toasts.success(t('toast.welcome', { name: user.displayName }));
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
  <AuthCard
    :title="isRegister ? t('auth.registerTitle') : t('auth.loginTitle')"
    :subtitle="isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')"
  >
    <form novalidate @submit.prevent="submit">
      <p v-if="redirect?.startsWith('/surveys/')" class="alert alert-info">{{ t('auth.redirectNotice') }}</p>
      <p v-if="formError" class="alert alert-error" role="alert">{{ formError }}</p>

      <div class="field">
        <label for="email">{{ t('auth.email') }}</label>
        <input
          id="email"
          v-model="form.email"
          class="input"
          type="email"
          name="email"
          autocomplete="email"
          autocapitalize="none"
          spellcheck="false"
          :maxlength="LIMITS.emailMax"
          :aria-invalid="!!errors.email"
          autofocus
        />
        <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
      </div>

      <div v-if="isRegister" class="field">
        <label for="display-name">{{ t('auth.displayName') }}</label>
        <input
          id="display-name"
          v-model="form.displayName"
          class="input"
          name="name"
          autocomplete="nickname"
          :maxlength="LIMITS.displayNameMax"
          :aria-invalid="!!errors.displayName"
        />
        <p v-if="errors.displayName" class="error-text">{{ errors.displayName }}</p>
        <p v-else class="hint">{{ t('auth.displayNameHint') }}</p>
      </div>

      <PasswordField
        id="password"
        v-model="form.password"
        :label="t('auth.password')"
        :autocomplete="isRegister ? 'new-password' : 'current-password'"
        :error="errors.password"
        :hint="isRegister ? t('auth.passwordHint', { min: LIMITS.passwordMin }) : undefined"
      />

      <PasswordField
        v-if="isRegister"
        id="password-repeat"
        v-model="form.passwordRepeat"
        :label="t('auth.passwordRepeat')"
        autocomplete="new-password"
        :error="errors.passwordRepeat"
      />

      <RouterLink v-if="!isRegister && auth.config.emailEnabled" :to="{ name: 'forgot-password' }" class="forgot">
        {{ t('auth.forgotPassword') }}
      </RouterLink>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        {{ isRegister ? t('auth.submitRegister') : t('auth.submitLogin') }}
      </button>

      <p class="switch muted">
        {{ isRegister ? t('auth.haveAccount') : t('auth.noAccount') }}
        <RouterLink :to="withRedirect(isRegister ? 'login' : 'register')">{{ isRegister ? t('nav.login') : t('nav.register') }}</RouterLink>
      </p>
    </form>
  </AuthCard>
</template>

<style scoped>
.forgot {
  justify-self: end;
  margin-top: -8px;
  font-size: 0.9rem;
}

.switch {
  text-align: center;
  font-size: 0.92rem;
}
</style>
