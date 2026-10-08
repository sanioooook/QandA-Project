<script setup lang="ts">
import { computed } from 'vue';

/** "185/200" next to a text field, shown only near the limit (maxlength silently cuts pasted text). */
const props = withDefaults(defineProps<{ value: string; max: number; from?: number }>(), { from: 0.8 });
const visible = computed(() => props.value.length >= props.max * props.from);
</script>

<template>
  <span v-if="visible" class="char-count" :class="{ full: value.length >= max }" aria-live="polite">
    {{ value.length }}/{{ max }}
  </span>
</template>

<style scoped>
.char-count {
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  white-space: nowrap;
}

.char-count.full {
  color: var(--warning);
  font-weight: 700;
}
</style>
