<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';

defineProps<{ text: string }>();
</script>

<template>
  <div class="empty card">
    <AppIcon name="inbox" :size="36" />
    <p>{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--text-muted);
  text-align: center;
}
</style>
