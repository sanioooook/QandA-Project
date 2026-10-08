import { describe, expect, it } from 'vitest';
import { detectLocale, i18n, slavicPlural } from './index';
import en from './locales/en';
import ru from './locales/ru';
import uk from './locales/uk';

function keys(object: object, prefix = ''): string[] {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]);
}

describe('i18n', () => {
  it('every locale has exactly the same keys', () => {
    expect(keys(uk).sort()).toEqual(keys(en).sort());
    expect(keys(ru).sort()).toEqual(keys(en).sort());
  });

  it.each([
    [1, 0], [21, 0], [101, 0],
    [2, 1], [4, 1], [22, 1], [34, 1],
    [0, 2], [5, 2], [11, 2], [12, 2], [14, 2], [111, 2], [25, 2],
  ])('slavic plural form of %i is %i', (n, form) => {
    expect(slavicPlural(n)).toBe(form);
  });

  it('pluralizes Ukrainian correctly', () => {
    const { t, locale } = i18n.global;
    locale.value = 'uk';
    expect(t('survey.votes', 1)).toBe('1 голос');
    expect(t('survey.votes', 3)).toBe('3 голоси');
    expect(t('survey.votes', 11)).toBe('11 голосів');
    locale.value = 'en';
    expect(t('survey.votes', 0)).toBe('no votes');
    expect(t('survey.votes', 2)).toBe('2 votes');
  });

  it.each([
    [['ru-RU', 'en'], 'ru'],
    [['de-DE', 'en-US'], 'en'],
    [['uk'], 'uk'],
    [['de', 'fr'], 'uk'],
    [[], 'uk'],
  ])('detects %j as %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });
});
