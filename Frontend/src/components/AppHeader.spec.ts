import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { routes } from '@/router';
import { useAuthStore } from '@/stores/auth';
import { account, json } from '@/test/fixtures';
import AppHeader from './AppHeader.vue';

describe('AppHeader while the session is loading', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en';
  });
  afterEach(() => vi.unstubAllGlobals());

  async function mountWithPendingSession() {
    let answerMe!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) =>
      url.startsWith('/api/auth/me')
        ? new Promise<Response>((resolve) => { answerMe = resolve; })
        : Promise.resolve(json(200, { emailEnabled: false, confirmationRequired: false }))));
    const pinia = createPinia();
    const router = createRouter({ history: createMemoryHistory(), routes });
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, router, i18n] } });
    void useAuthStore(pinia).init();
    await flushPromises();
    return { wrapper, answerMe };
  }

  it('shows a placeholder instead of the guest buttons, then the account menu', async () => {
    const { wrapper, answerMe } = await mountWithPendingSession();

    expect(wrapper.find('.avatar-placeholder').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Sign in');

    answerMe(json(200, account()));
    await flushPromises();

    expect(wrapper.find('.avatar-placeholder').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Account menu"]').exists()).toBe(true);
  });

  it('shows the guest buttons once the server says nobody is signed in', async () => {
    const { wrapper, answerMe } = await mountWithPendingSession();

    answerMe(json(401));
    await flushPromises();

    expect(wrapper.text()).toContain('Sign in');
    expect(wrapper.find('.avatar-placeholder').exists()).toBe(false);
  });
});
