import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

export const useToastsStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function show(kind: Toast['kind'], message: string, timeoutMs = 4000): void {
    const id = nextId++;
    toasts.value = [...toasts.value.slice(-3), { id, kind, message }];
    setTimeout(() => dismiss(id), timeoutMs);
  }

  return {
    toasts,
    dismiss,
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message, 6000),
  };
});
