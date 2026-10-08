<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import PasswordField from '@/components/PasswordField.vue';
import { useErrors } from '@/composables/useErrors';
import { LIMITS } from '@/limits';
import { useAuthStore } from '@/stores/auth';
import { useToastsStore } from '@/stores/toasts';
import { passwordError } from '@/utils/accountRules';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const toasts = useToastsStore();
const { codeMessage, errorMessage, fieldErrors } = useErrors();

const form = reactive({ currentPassword: '', newPassword: '', repeat: '' });
const errors = ref<Record<string, string>>({});
const formError = ref('');
const saving = ref(false);

async function submit() {
  formError.value = '';
  errors.value = {};
  if (!form.currentPassword) errors.value.currentPassword = t('errors.required');
  const code = passwordError(form.newPassword, auth.user?.email ?? '');
  if (code) errors.value.newPassword = codeMessage(code);
  else if (form.newPassword === form.currentPassword) errors.value.newPassword = t('account.samePassword');
  if (form.repeat !== form.newPassword) errors.value.repeat = t('auth.passwordsMismatch');
  if (Object.keys(errors.value).length) return;

  saving.value = true;
  try {
    await auth.changePassword(form.currentPassword, form.newPassword);
    toasts.success(t('toast.passwordChanged'));
    await router.push({ name: 'account' });
  } catch (error) {
    errors.value = fieldErrors(error);
    if (!Object.keys(errors.value).length) formError.value = errorMessage(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="change-password">
    <div class="page-head">
      <div>
        <h1>{{ t('menu.changePassword') }}</h1>
        <p class="muted">{{ t('account.changePasswordHint') }}</p>
      </div>
    </div>
    <form class="card form" novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert alert-error" role="alert">{{ formError }}</p>
      <PasswordField
        id="current-password"
        v-model="form.currentPassword"
        :label="t('account.currentPassword')"
        autocomplete="current-password"
        :error="errors.currentPassword"
      />
      <RouterLink v-if="auth.config.emailEnabled" :to="{ name: 'forgot-password' }" class="forgot">{{ t('auth.forgotPassword') }}</RouterLink>
      <PasswordField
        id="new-password"
        v-model="form.newPassword"
        :label="t('auth.newPassword')"
        autocomplete="new-password"
        :error="errors.newPassword"
        :hint="t('auth.passwordHint', { min: LIMITS.passwordMin })"
      />
      <PasswordField id="repeat-password" v-model="form.repeat" :label="t('auth.passwordRepeat')" autocomplete="new-password" :error="errors.repeat" />
      <div class="buttons">
        <RouterLink :to="{ name: 'account' }" class="btn btn-ghost">{{ t('form.cancel') }}</RouterLink>
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ t('auth.saveNewPassword') }}</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.change-password {
  max-width: 480px;
  margin: 0 auto;
}

.form {
  display: grid;
  gap: 18px;
  padding: clamp(18px, 3vw, 28px);
}

.forgot {
  justify-self: end;
  margin-top: -10px;
  font-size: 0.9rem;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
