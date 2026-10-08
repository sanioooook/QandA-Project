import { onUnmounted, ref } from 'vue';

/** Current time (ms) that updates every `intervalMs` while the component is mounted. */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());
  const timer = setInterval(() => {
    now.value = Date.now();
  }, intervalMs);
  onUnmounted(() => clearInterval(timer));
  return now;
}
