<script setup lang="ts">
import { storeToRefs } from 'pinia';
import AppIcon from '@/components/AppIcon.vue';
import { useToastsStore } from '@/stores/toasts';

const store = useToastsStore();
const { toasts } = storeToRefs(store);
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.kind">
        <AppIcon :name="toast.kind === 'success' ? 'check' : 'x'" :size="16" />
        <span>{{ toast.message }}</span>
        <button type="button" class="close" aria-label="Close" @click="store.dismiss(toast.id)">
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 50;
  display: grid;
  justify-items: end;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 10px 10px 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.toast.success svg:first-child {
  color: var(--success);
}

.toast.error svg:first-child {
  color: var(--danger);
}

.close {
  display: grid;
  place-items: center;
  padding: 4px;
  border: 0;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
