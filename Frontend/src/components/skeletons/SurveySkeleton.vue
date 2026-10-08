<script setup lang="ts">
// The survey page while it loads: status, question, author, countdown, options and the vote button.
</script>

<template>
  <article class="main card" aria-hidden="true">
    <div class="row">
      <span class="skeleton pill" />
      <span class="skeleton line small" style="width: 160px" />
    </div>
    <span class="skeleton line title" style="width: 80%" />
    <div class="row">
      <span class="skeleton circle" />
      <span class="skeleton line small" style="width: 45%" />
    </div>
    <span class="skeleton block" />
    <span class="skeleton line small" style="width: 140px" />
    <span v-for="width in [58, 34, 12]" :key="width" class="option">
      <span class="skeleton bar" :style="{ width: `${width}%` }" />
    </span>
    <span class="skeleton button" />
  </article>
</template>

<style scoped>
.main {
  display: grid;
  gap: 16px;
  padding: clamp(18px, 3vw, 28px);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pill {
  width: 64px;
  height: 22px;
  border-radius: 999px;
}

.line {
  height: 14px;
}

.line.small {
  height: 12px;
}

.line.title {
  height: 30px;
}

.circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.block {
  height: 58px;
}

/* An option row: the bar stands for the result fill. */
.option {
  display: block;
  height: 52px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  border-radius: 0;
}

.button {
  width: 140px;
  height: 40px;
}
</style>
