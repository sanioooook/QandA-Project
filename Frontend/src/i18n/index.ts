import { createI18n } from 'vue-i18n';
import en from './locales/en';
import ru from './locales/ru';
import uk from './locales/uk';

export const LOCALES = ['uk', 'en', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = { uk: 'Українська', en: 'English', ru: 'Русский' };

export type MessageSchema = typeof en;

/** East Slavic plural forms, messages are written as "one | few | many". */
export function slavicPlural(choice: number): number {
  const n = Math.abs(choice);
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 0;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 1;
  return 2;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * First supported language from the browser preferences. A browser in some other language gets
 * English; Ukrainian only when the browser reports no languages at all.
 */
export function detectLocale(languages: readonly string[] = navigator.languages ?? []): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return languages.length > 0 ? 'en' : 'uk';
}

export const i18n = createI18n({
  legacy: false,
  locale: 'uk' as Locale,
  fallbackLocale: 'en',
  messages: { en, uk, ru },
  pluralRules: { uk: slavicPlural, ru: slavicPlural },
});
