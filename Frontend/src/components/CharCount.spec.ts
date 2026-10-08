import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CharCount from './CharCount.vue';

describe('CharCount', () => {
  it.each([
    ['a'.repeat(159), ''],
    ['a'.repeat(160), '160/200'],
    ['a'.repeat(200), '200/200'],
  ])('for %#: shows %j', (value, text) => {
    expect(mount(CharCount, { props: { value, max: 200 } }).text()).toBe(text);
  });

  it('marks the limit', () => {
    expect(mount(CharCount, { props: { value: 'a'.repeat(200), max: 200 } }).find('.full').exists()).toBe(true);
    expect(mount(CharCount, { props: { value: 'a'.repeat(190), max: 200 } }).find('.full').exists()).toBe(false);
  });
});
