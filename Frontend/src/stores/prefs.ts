import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { detectLocale, i18n, isLocale, type Locale } from '@/i18n';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'qanda.theme';
const LOCALE_KEY = 'qanda.locale';

// Storage can throw (privacy mode, blocked site data): preferences then just are not remembered.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export const usePrefsStore = defineStore('prefs', () => {
  const storedTheme = read(THEME_KEY);
  const storedLocale = read(LOCALE_KEY);

  const theme = ref<Theme>(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system');
  const locale = ref<Locale>(isLocale(storedLocale) ? storedLocale : detectLocale());

  function applyTheme(value: Theme): void {
    const root = document.documentElement;
    if (value === 'system') delete root.dataset.theme;
    else root.dataset.theme = value;
  }

  function applyLocale(value: Locale): void {
    i18n.global.locale.value = value;
    document.documentElement.lang = value;
  }

  watch(theme, (value) => { applyTheme(value); write(THEME_KEY, value); }, { immediate: true });
  watch(locale, (value) => { applyLocale(value); write(LOCALE_KEY, value); }, { immediate: true });

  return { theme, locale };
});
