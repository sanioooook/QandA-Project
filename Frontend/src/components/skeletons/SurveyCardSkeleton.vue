<script setup lang="ts">
// Same box and rhythm as SurveyCard, so the list does not jump when the data arrives.
</script>

<template>
  <div class="survey-card card" aria-hidden="true">
    <span class="skeleton pill" />
    <span class="skeleton line" style="width: 92%" />
    <span class="skeleton line" style="width: 64%" />
    <div class="meta">
      <span class="skeleton circle" />
      <span class="skeleton line small" style="width: 55%" />
    </div>
    <span class="skeleton line small" style="width: 70%" />
  </div>
</template>

<style scoped>
.survey-card {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 18px;
}

.pill {
  width: 64px;
  height: 22px;
  border-radius: 999px;
}

.line {
  height: 16px;
}

.line.small {
  height: 12px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.circle {
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 50%;
}
</style>
