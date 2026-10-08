<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AuthCard from '@/components/AuthCard.vue';
import { useErrors } from '@/composables/useErrors';
import { LIMITS } from '@/limits';
import { useAuthStore } from '@/stores/auth';
import { usePrefsStore } from '@/stores/prefs';
import { emailError } from '@/utils/accountRules';

const { t } = useI18n();
const auth = useAuthStore();
const prefs = usePrefsStore();
const { codeMessage, errorMessage } = useErrors();

const email = ref(auth.user?.email ?? '');
const error = ref('');
const sent = ref(false);
const submitting = ref(false);

async function submit() {
  const code = emailError(email.value);
  error.value = code ? codeMessage(code) : '';
  if (code) return;
  submitting.value = true;
  try {
    await auth.forgotPassword(email.value.trim(), prefs.locale);
    sent.value = true;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AuthCard :title="t('auth.forgotTitle')" :subtitle="sent ? undefined : t('auth.forgotSubtitle')">
    <p v-if="!auth.config.emailEnabled" class="alert alert-warning">{{ t('auth.emailUnavailable') }}</p>
    <p v-else-if="sent" class="alert alert-info" role="status">{{ t('auth.forgotSent', { email }) }}</p>
    <form v-else novalidate @submit.prevent="submit">
      <div class="field">
        <label for="email">{{ t('auth.email') }}</label>
        <input
          id="email"
          v-model="email"
          class="input"
          type="email"
          autocomplete="email"
          :maxlength="LIMITS.emailMax"
          :aria-invalid="!!error"
          autofocus
        />
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>
      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">{{ t('auth.sendResetLink') }}</button>
    </form>
    <RouterLink :to="{ name: 'login' }" class="back">{{ t('auth.backToLogin') }}</RouterLink>
  </AuthCard>
</template>

<style scoped>
.back {
  justify-self: center;
  font-size: 0.92rem;
}
</style>
