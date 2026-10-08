<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import AppIcon, { type IconName } from '@/components/AppIcon.vue';
import { LOCALE_NAMES, LOCALES } from '@/i18n';
import { usePrefsStore, type Theme } from '@/stores/prefs';

const { t } = useI18n();
const { theme, locale } = storeToRefs(usePrefsStore());

// Short labels keep the header on one line; "UA" rather than the ISO "UK" to avoid reading it as the United Kingdom.
const LOCALE_LABELS = { uk: 'UA', en: 'EN', ru: 'RU' } as const;

const themes: { value: Theme; icon: IconName }[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'monitor' },
];
</script>

<template>
  <div class="prefs">
    <label class="sr-only" for="locale-select">{{ t('prefs.language') }}</label>
    <select id="locale-select" v-model="locale" class="locale input" :title="`${t('prefs.language')}: ${LOCALE_NAMES[locale]}`">
      <option v-for="code in LOCALES" :key="code" :value="code" :title="LOCALE_NAMES[code]">{{ LOCALE_LABELS[code] }}</option>
    </select>

    <div class="theme" role="radiogroup" :aria-label="t('prefs.theme')">
      <button
        v-for="item in themes"
        :key="item.value"
        type="button"
        role="radio"
        class="theme-btn"
        :class="{ active: theme === item.value }"
        :aria-checked="theme === item.value"
        :title="t(`prefs.${item.value}`)"
        :aria-label="t(`prefs.${item.value}`)"
        @click="theme = item.value"
      >
        <AppIcon :name="item.icon" :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.prefs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.locale {
  width: auto;
  min-height: 36px;
  padding: 4px 8px;
  font-size: 0.85rem;
}

.theme {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
}

.theme-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.theme-btn.active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow);
}
</style>
