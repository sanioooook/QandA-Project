<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import AuthCard from '@/components/AuthCard.vue';
import PasswordField from '@/components/PasswordField.vue';
import { useErrors } from '@/composables/useErrors';
import { LIMITS } from '@/limits';
import { useAuthStore } from '@/stores/auth';
import { useToastsStore } from '@/stores/toasts';
import { passwordError } from '@/utils/accountRules';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toasts = useToastsStore();
const { codeMessage, errorMessage, fieldErrors } = useErrors();

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));
const form = reactive({ password: '', passwordRepeat: '' });
const errors = ref<Record<string, string>>({});
const linkInvalid = ref(!token.value);
const formError = ref('');
const submitting = ref(false);

async function submit() {
  formError.value = '';
  errors.value = {};
  const code = passwordError(form.password, '');
  if (code) errors.value.password = codeMessage(code);
  if (form.password !== form.passwordRepeat) errors.value.passwordRepeat = t('auth.passwordsMismatch');
  if (Object.keys(errors.value).length) return;

  submitting.value = true;
  try {
    await auth.resetPassword(token.value, form.password);
    toasts.success(t('toast.passwordChanged'));
    await router.replace({ name: 'active' });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'token_invalid') linkInvalid.value = true;
    errors.value = fieldErrors(error);
    if (!Object.keys(errors.value).length) formError.value = errorMessage(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AuthCard :title="t('auth.resetTitle')" :subtitle="linkInvalid ? undefined : t('auth.resetSubtitle')">
    <template v-if="linkInvalid">
      <p class="alert alert-error" role="alert">{{ t('errors.token_invalid') }}</p>
      <RouterLink :to="{ name: 'forgot-password' }" class="btn btn-primary btn-block">{{ t('auth.requestNewLink') }}</RouterLink>
    </template>
    <form v-else novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert alert-error" role="alert">{{ formError }}</p>
      <PasswordField
        id="password"
        v-model="form.password"
        :label="t('auth.newPassword')"
        autocomplete="new-password"
        :error="errors.password"
        :hint="t('auth.passwordHint', { min: LIMITS.passwordMin })"
      />
      <PasswordField
        id="password-repeat"
        v-model="form.passwordRepeat"
        :label="t('auth.passwordRepeat')"
        autocomplete="new-password"
        :error="errors.passwordRepeat"
      />
      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">{{ t('auth.saveNewPassword') }}</button>
    </form>
  </AuthCard>
</template>
