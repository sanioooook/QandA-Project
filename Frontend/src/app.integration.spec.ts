import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { createQandaApp } from './app';
import { FakeApi } from './test/fakeApi';

// The whole app (router, stores, i18n, every page) running against an in-memory API.
// Elements are found the way a user sees them (roles, labels, texts), not by CSS classes,
// so layout changes do not break these tests.

let api: FakeApi;
let unmount: () => void;
const user = userEvent.setup();

async function startApp(path: string) {
  const { app, router } = createQandaApp(createMemoryHistory());
  await router.push(path);
  const root = document.body.appendChild(document.createElement('div'));
  app.mount(root);
  await router.isReady();
  unmount = () => {
    app.unmount();
    root.remove();
  };
  return router;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('qanda.locale', 'en');
  api = new FakeApi();
  api.install();
});

afterEach(() => {
  unmount?.();
  vi.unstubAllGlobals();
});

describe('app', () => {
  it('a guest opens a shared link, signs up and comes back to vote', async () => {
    const bob = api.addUser('bob@example.com', 'Bob');
    const survey = api.addSurvey(bob, 'Lunch on Friday?', ['Pizza', 'Sushi']);

    await startApp(`/surveys/${survey.id}`);
    await screen.findByRole('heading', { name: 'Lunch on Friday?' });
    expect(screen.getByText('Sign in to vote')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Vote' })).toBeNull();

    await user.click(screen.getAllByRole('link', { name: 'Sign up' })[0]!);
    await user.type(await screen.findByLabelText('Email'), 'carol@example.com');
    await user.type(screen.getByLabelText('Name'), 'Carol');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.type(screen.getByLabelText('Repeat password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByRole('heading', { name: 'Lunch on Friday?' });
    await user.click(screen.getByRole('radio', { name: /Sushi/ }));
    await user.click(screen.getByRole('button', { name: 'Vote' }));

    await screen.findByText('100%');
    expect(screen.getByRole('button', { name: 'Update vote' })).toBeTruthy();
    expect(api.callsTo('PUT /api/surveys')).toHaveLength(1);
  });

  it('an author creates and publishes a survey and lands on its page', async () => {
    api.addUser('alice@example.com', 'Alice');

    await startApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await user.click((await screen.findAllByRole('link', { name: 'New survey' }))[0]!);
    await user.type(await screen.findByLabelText('Question'), 'Where do we go?');
    await user.type(screen.getByPlaceholderText('Option 1'), 'Cinema');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Park');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    await screen.findByRole('heading', { name: 'Where do we go?' });
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
    expect(api.surveys).toHaveLength(1);
    expect(api.surveys[0]).toMatchObject({ status: 'active', title: 'Where do we go?' });
  });

  it('client-side validation stops a broken survey before any request', async () => {
    const alice = api.addUser('alice@example.com', 'Alice');
    api.sessionUserId = alice.id;

    await startApp('/surveys/new');
    await user.type(await screen.findByPlaceholderText('Option 1'), 'Same');
    await user.type(screen.getByPlaceholderText('Option 2'), 'same');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Enter the question.')).toBeTruthy();
    expect(screen.getByText('This option already exists.')).toBeTruthy();
    expect(api.callsTo('POST /api/surveys')).toHaveLength(0);
  });

  it('going back to the list reuses the cache instead of asking the server again', async () => {
    const alice = api.addUser('alice@example.com', 'Alice');
    api.addSurvey(alice, 'Cached survey', ['A', 'B']);
    api.sessionUserId = alice.id;

    const router = await startApp('/surveys');
    await user.click(await screen.findByRole('link', { name: /Cached survey/ }));
    await screen.findByRole('heading', { name: 'Cached survey' });
    router.back();
    await screen.findByRole('link', { name: /Cached survey/ });
    await user.click(screen.getByRole('link', { name: /Cached survey/ }));
    await screen.findByRole('heading', { name: 'Cached survey' });

    expect(api.callsTo('GET /api/surveys?')).toHaveLength(1);
    expect(api.callsTo('GET /api/surveys/s')).toHaveLength(1);
  });

  it('an expired session while voting sends the user to sign in and back to the survey', async () => {
    const alice = api.addUser('alice@example.com', 'Alice');
    const survey = api.addSurvey(alice, 'Expiring', ['Yes', 'No']);
    api.sessionUserId = alice.id;
    api.expireSessionOn = `PUT /api/surveys/${survey.id}/votes`;

    const router = await startApp(`/surveys/${survey.id}`);
    await user.click(await screen.findByRole('radio', { name: /Yes/ }));
    await user.click(screen.getByRole('button', { name: 'Vote' }));

    await screen.findByRole('heading', { name: 'Welcome back' });
    expect(router.currentRoute.value.query.redirect).toBe(`/surveys/${survey.id}`);
    await waitFor(() => expect(screen.getByText('Your session has expired. Please sign in again.')).toBeTruthy());
  });
});
