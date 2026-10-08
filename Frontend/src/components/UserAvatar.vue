<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { avatarHue, initials } from '@/utils/image';

const props = withDefaults(defineProps<{ name: string; url?: string | null; size?: number }>(), { url: null, size: 32 });

// A broken image (deleted meanwhile, offline) falls back to the letters.
const failed = ref(false);
watch(() => props.url, () => { failed.value = false; });

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.4)}px`,
  '--hue': avatarHue(props.name),
}));
</script>

<template>
  <span class="avatar" :style="style" aria-hidden="true">
    <img v-if="url && !failed" :src="url" alt="" loading="lazy" @error="failed = true" />
    <span v-else>{{ initials(name) }}</span>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
  background: hsl(var(--hue) 65% 88%);
  color: hsl(var(--hue) 55% 30%);
  font-weight: 700;
  line-height: 1;
  user-select: none;
}

:root[data-theme='dark'] .avatar {
  background: hsl(var(--hue) 35% 26%);
  color: hsl(var(--hue) 80% 82%);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .avatar {
    background: hsl(var(--hue) 35% 26%);
    color: hsl(var(--hue) 80% 82%);
  }
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
