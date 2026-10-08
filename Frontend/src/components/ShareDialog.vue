<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/AppIcon.vue';
import { useToastsStore } from '@/stores/toasts';

const props = defineProps<{ url: string; title: string }>();

const { t } = useI18n();
const toasts = useToastsStore();
const dialog = ref<HTMLDialogElement | null>(null);
const link = ref<HTMLElement | null>(null);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
const canNativeShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');

function open() {
  copied.value = false;
  dialog.value?.showModal();
}

function selectLink() {
  if (!link.value) return;
  const range = document.createRange();
  range.selectNodeContents(link.value);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
}

function close() {
  dialog.value?.close();
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // Clipboard API unavailable (e.g. plain http on a LAN address): select the link for Ctrl+C.
    selectLink();
    toasts.error(t('survey.copyManually'));
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
      <div class="link-box">
        <code ref="link" class="url" :title="url" @click="selectLink">{{ url }}</code>
        <button
          type="button"
          class="icon-btn copy"
          :class="{ done: copied }"
          :aria-label="copied ? t('toast.linkCopied') : t('survey.copyLink')"
          :title="copied ? t('toast.linkCopied') : t('survey.copyLink')"
          @click="copy"
        >
          <AppIcon :name="copied ? 'check' : 'copy'" :size="17" />
        </button>
        <span class="sr-only" aria-live="polite">{{ copied ? t('toast.linkCopied') : '' }}</span>
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
  /* minmax(0, …) keeps a long link from stretching the dialog sideways. */
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 20px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.link-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 0.9rem/1.6 ui-monospace, 'Cascadia Code', Consolas, monospace;
  color: var(--text);
}

.copy.done {
  color: var(--success);
}
</style>
