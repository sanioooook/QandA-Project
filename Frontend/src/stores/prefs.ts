import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { detectLocale, i18n, isLocale, type Locale } from '@/i18n';
import { browserTimeZone, currentName, isTimeZone } from '@/utils/timeZone';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'qanda.theme';
const LOCALE_KEY = 'qanda.locale';
const TIME_ZONE_KEY = 'qanda.timeZone';

/** 'auto' follows the device; otherwise an IANA zone such as 'Europe/Kyiv'. */
export type TimeZonePref = 'auto' | string;

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
  const storedZone = read(TIME_ZONE_KEY);
  const timeZone = ref<TimeZonePref>(isTimeZone(storedZone) ? currentName(storedZone) : 'auto');
  /** The zone all dates are shown in and deadline times are entered in. */
  const effectiveTimeZone = computed(() => (timeZone.value === 'auto' ? browserTimeZone() : timeZone.value));

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

  watch(timeZone, (value) => write(TIME_ZONE_KEY, value));

  return { theme, locale, timeZone, effectiveTimeZone };
});
