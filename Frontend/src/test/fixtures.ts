import { vi } from 'vitest';
import type { Paged, SurveyDetails, SurveySummary } from '@/api/types';

export function survey(overrides: Partial<SurveyDetails> = {}): SurveyDetails {
  return {
    id: 's1',
    title: 'Where do we go?',
    description: null,
    author: { id: 1, login: 'alice' },
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
    author: { id: 1, login: 'alice' },
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
