import { vi } from 'vitest';
import type { Account, Paged, SurveyDetails, SurveySummary } from '@/api/types';

export function survey(overrides: Partial<SurveyDetails> = {}): SurveyDetails {
  return {
    id: 's1',
    title: 'Where do we go?',
    description: null,
    author: { id: 1, name: 'Alice', avatarUrl: null },
    createdAt: '2026-10-01T10:00:00Z',
    publishedAt: '2026-10-01T10:00:00Z',
    deadline: null,
    status: 'active',
    maxVotesPerUser: 1,
    allowParticipantOptions: false,
    maxOptionsPerParticipant: 1,
    isAuthor: false,
    voterCount: 0,
    totalVotes: 0,
    myVotes: [],
    myAddedOptions: 0,
    canVote: true,
    canAddOption: false,
    options: [
      { id: 1, text: 'Cinema', votes: 0, addedBy: null, voters: null },
      { id: 2, text: 'Park', votes: 0, addedBy: null, voters: null },
      { id: 3, text: 'Museum', votes: 0, addedBy: null, voters: null },
    ],
    ...overrides,
  };
}

export function summary(overrides: Partial<SurveySummary> = {}): SurveySummary {
  return {
    id: 's1',
    title: 'Where do we go?',
    author: { id: 1, name: 'Alice', avatarUrl: null },
    createdAt: '2026-10-01T10:00:00Z',
    publishedAt: '2026-10-01T10:00:00Z',
    deadline: null,
    status: 'active',
    optionCount: 3,
    voterCount: 0,
    hasVoted: false,
    ...overrides,
  };
}

export function paged<T>(items: T[]): Paged<T> {
  return { items, total: items.length, page: 1, pageSize: 20 };
}

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Replaces global fetch; each call takes the next queued response. */
export function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error('Unexpected fetch call');
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function account(overrides: Partial<Account> = {}): Account {
  return { id: 1, email: 'alice@example.com', displayName: 'Alice', emailConfirmed: true, locale: 'en', avatarUrl: null, ...overrides };
}

export interface Reply {
  status: number;
  body?: unknown;
}

export const reply = (status: number, body?: unknown): Reply => ({ status, body });

type Route = Reply | Reply[] | ((request: { url: string; body: unknown }) => Reply);

/**
 * Stubs fetch with routes keyed by "METHOD /path" (query string ignored). A list of replies is used in
 * order and its last item repeats. Unknown routes fail the test; the auth config defaults to "no email".
 */
export function mockApi(routes: Record<string, Route>) {
  const table: Record<string, Route> = {
    'GET /api/auth/config': reply(200, { emailEnabled: false, confirmationRequired: false }),
    ...routes,
  };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const key = `${init?.method ?? 'GET'} ${url.split('?')[0]}`;
    const route = table[key];
    if (!route) throw new Error(`Unexpected request ${key}`);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const next = Array.isArray(route) ? (route.length > 1 ? route.shift()! : route[0]!) : typeof route === 'function' ? route({ url, body }) : route;
    return json(next.status, next.body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
