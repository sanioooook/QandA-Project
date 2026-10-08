<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useErrors } from '@/composables/useErrors';
import { useNow } from '@/composables/useNow';
import { useAuthStore } from '@/stores/auth';
import { useToastsStore } from '@/stores/toasts';

const RESEND_COOLDOWN_MS = 60_000;

const { t } = useI18n();
const auth = useAuthStore();
const toasts = useToastsStore();
const { errorMessage } = useErrors();
const now = useNow(1000);

const sentAt = ref(0);
const sending = ref(false);
const wait = computed(() => Math.max(0, Math.ceil((sentAt.value + RESEND_COOLDOWN_MS - now.value) / 1000)));

async function resend() {
  sending.value = true;
  try {
    await auth.resendConfirmation();
    sentAt.value = Date.now();
    toasts.success(t('toast.confirmationSent'));
  } catch (error) {
    toasts.error(errorMessage(error));
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div v-if="auth.needsConfirmation" class="banner" role="status">
    <div class="container inner">
      <p>{{ t('auth.confirmBanner', { email: auth.user?.email }) }}</p>
      <button type="button" class="btn btn-sm" :disabled="sending || wait > 0" @click="resend">
        {{ wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.banner {
  background: var(--warning-soft);
  border-bottom: 1px solid var(--border);
}

.inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 0.92rem;
}
</style>
