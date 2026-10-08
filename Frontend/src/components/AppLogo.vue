<script setup lang="ts">
// Inline, so the logo is there on the first paint instead of waiting for another request.
withDefaults(defineProps<{ size?: number }>(), { size: 28 });
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" fill="#4f46e5" />
    <rect x="7" y="17" width="4" height="8" rx="1.5" fill="#fff" />
    <rect x="14" y="11" width="4" height="14" rx="1.5" fill="#fff" />
    <rect x="21" y="7" width="4" height="18" rx="1.5" fill="#fff" />
  </svg>
</template>
