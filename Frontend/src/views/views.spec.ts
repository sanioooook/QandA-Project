import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { routes } from '@/router';
import { json, mockFetch, survey } from '@/test/fixtures';
import AuthView from './AuthView.vue';
import SurveyView from './SurveyView.vue';

async function mountView(component: object, props: Record<string, unknown>, path = '/') {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  const wrapper = mount(component, { props, global: { plugins: [pinia, router, i18n] } });
  await flushPromises();
  return { wrapper, router };
}

describe('AuthView (register)', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does not call the API when the form is invalid', async () => {
    const fetchMock = mockFetch();
    const { wrapper } = await mountView(AuthView, { mode: 'register' }, '/register');

    await wrapper.find('#login').setValue('ab');
    await wrapper.find('#password').setValue('Secret123');
    await wrapper.find('#password-repeat').setValue('Secret124');
    await wrapper.find('form').trigger('submit');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Login must be 3–30 characters.');
    expect(wrapper.text()).toContain('Passwords do not match');
  });

  it('shows the server error next to the field', async () => {
    mockFetch(json(409, { code: 'login_taken', title: 'Taken', errors: { login: ['login_taken'] } }));
    const { wrapper } = await mountView(AuthView, { mode: 'register' }, '/register');

    await wrapper.find('#login').setValue('alice');
    await wrapper.find('#password').setValue('Secret123');
    await wrapper.find('#password-repeat').setValue('Secret123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('#login').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('This login is already taken.');
  });
});

describe('SurveyView voting', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does not let the user pick more options than allowed', async () => {
    mockFetch(json(200, survey({ maxVotesPerUser: 2 })));
    const { wrapper } = await mountView(SurveyView, { id: 's1' }, '/surveys/s1');

    const boxes = wrapper.findAll('input[type="checkbox"]');
    await boxes[0]!.setValue(true);
    await boxes[1]!.setValue(true);

    expect(boxes[2]!.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('2 of 2 selected');
  });

  it('sends the selection and shows the result returned by the API', async () => {
    const fetchMock = mockFetch(
      json(200, survey()),
      json(200, survey({
        myVotes: [2],
        totalVotes: 1,
        voterCount: 1,
        options: survey().options.map((o) => (o.id === 2 ? { ...o, votes: 1 } : o)),
      })),
    );
    const { wrapper } = await mountView(SurveyView, { id: 's1' }, '/surveys/s1');

    await wrapper.findAll('input[type="radio"]')[1]!.setValue(true);
    await wrapper.find('.vote-actions .btn-primary').trigger('click');
    await flushPromises();

    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe('/api/surveys/s1/votes');
    expect(JSON.parse(init.body as string)).toEqual({ optionIds: [2] });
    expect(wrapper.text()).toContain('100%');
    expect(wrapper.text()).toContain('Update vote');
  });

  it('closed survey shows results without inputs to vote', async () => {
    mockFetch(json(200, survey({ status: 'closed', canVote: false, deadline: '2026-01-01T00:00:00Z' })));
    const { wrapper } = await mountView(SurveyView, { id: 's1' }, '/surveys/s1');

    expect(wrapper.findAll('input[type="radio"]').every((input) => input.attributes('disabled') !== undefined)).toBe(true);
    expect(wrapper.find('.vote-actions').exists()).toBe(false);
    expect(wrapper.text()).toContain('Voting is over');
  });
});
