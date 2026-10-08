<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/AppIcon.vue';
import { LIMITS } from '@/limits';

defineProps<{
  id: string;
  label: string;
  autocomplete: 'current-password' | 'new-password';
  error?: string;
  hint?: string;
}>();
const model = defineModel<string>({ required: true });

const { t } = useI18n();
const visible = ref(false);
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="password">
      <input
        :id="id"
        v-model="model"
        class="input"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :maxlength="LIMITS.passwordMax"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-note` : undefined"
      />
      <button
        type="button"
        class="icon-btn reveal"
        :aria-label="visible ? t('auth.hidePassword') : t('auth.showPassword')"
        :title="visible ? t('auth.hidePassword') : t('auth.showPassword')"
        @click="visible = !visible"
      >
        <AppIcon :name="visible ? 'eyeOff' : 'eye'" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-note`" class="error-text">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-note`" class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.password {
  position: relative;
}

.password .input {
  padding-right: 46px;
}

.reveal {
  position: absolute;
  top: 3px;
  right: 3px;
}
</style>
