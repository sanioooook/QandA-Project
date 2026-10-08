<script setup lang="ts">
// The survey form while a draft loads: labels and fields in the form's own layout.
</script>

<template>
  <div class="card form" aria-hidden="true">
    <div v-for="field in ['question', 'description']" :key="field" class="field">
      <span class="skeleton label" />
      <span class="skeleton input" :class="field" />
    </div>
    <div class="field">
      <span class="skeleton label" />
      <span v-for="n in 2" :key="n" class="skeleton input" />
    </div>
    <div class="footer">
      <span class="skeleton button" />
      <span class="skeleton button primary" />
    </div>
  </div>
</template>

<style scoped>
.form {
  display: grid;
  gap: 22px;
  padding: clamp(18px, 3vw, 28px);
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  width: 120px;
  height: 12px;
}

.input {
  height: 42px;
}

.input.description {
  height: 84px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.button {
  width: 120px;
  height: 40px;
}
</style>
