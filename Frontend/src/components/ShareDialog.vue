<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/AppIcon.vue';
import { useToastsStore } from '@/stores/toasts';

const props = defineProps<{ url: string; title: string }>();

const { t } = useI18n();
const toasts = useToastsStore();
const dialog = ref<HTMLDialogElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const canNativeShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');

function open() {
  dialog.value?.showModal();
  input.value?.select();
}

function close() {
  dialog.value?.close();
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url);
    toasts.success(t('toast.linkCopied'));
    close();
  } catch {
    // Clipboard API unavailable (e.g. plain http on a LAN address): leave the link selected for Ctrl+C.
    input.value?.select();
  }
}

async function nativeShare() {
  try {
    await navigator.share({ title: props.title, url: props.url });
    close();
  } catch {
    // Cancelled by the user.
  }
}

// A click on the backdrop lands on the <dialog> element itself.
function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) close();
}

defineExpose({ open });
</script>

<template>
  <button type="button" class="icon-btn share-btn" :title="t('survey.share')" :aria-label="t('survey.share')" @click="open">
    <AppIcon name="share" :size="18" />
  </button>

  <dialog ref="dialog" class="dialog card" aria-labelledby="share-title" @click="onBackdrop">
    <div class="body">
      <header class="head">
        <h2 id="share-title">{{ t('survey.share') }}</h2>
        <button type="button" class="icon-btn" :aria-label="t('common.close')" :title="t('common.close')" @click="close">
          <AppIcon name="x" :size="16" />
        </button>
      </header>
      <p class="muted hint">{{ t('survey.shareHint') }}</p>
      <div class="row">
        <input ref="input" class="input" :value="url" readonly :aria-label="t('survey.share')" @focus="input?.select()" />
        <button type="button" class="btn btn-primary" @click="copy">
          <AppIcon name="link" :size="16" />{{ t('survey.copyLink') }}
        </button>
      </div>
      <button v-if="canNativeShare" type="button" class="btn btn-block" @click="nativeShare">
        <AppIcon name="share" :size="16" />{{ t('survey.shareVia') }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(520px, calc(100vw - 32px));
  padding: 0;
  color: var(--text);
}

.dialog::backdrop {
  background: rgb(10 12 18 / 0.55);
  backdrop-filter: blur(2px);
}

.body {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row {
  display: flex;
  gap: 8px;
}

@media (max-width: 480px) {
  .row {
    flex-direction: column;
  }
}
</style>
