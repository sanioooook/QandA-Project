import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { json, mockFetch, paged, summary, survey } from '@/test/fixtures';
import { CACHE_TTL_MS, useSurveysStore } from './surveys';

describe('surveys store', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('serves a fresh list from the cache without a second request', async () => {
    const fetchMock = mockFetch(json(200, paged([summary()])));
    const store = useSurveysStore();

    await store.fetchList({ scope: 'active' });
    const again = await store.fetchList({ scope: 'active' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(again.items).toHaveLength(1);
  });

  it('refetches after the TTL or when forced', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch(json(200, paged([])), json(200, paged([])), json(200, paged([])));
    const store = useSurveysStore();

    await store.fetchList({ scope: 'active' });
    await store.fetchList({ scope: 'active' }, { force: true });
    vi.advanceTimersByTime(CACHE_TTL_MS + 1);
    await store.fetchList({ scope: 'active' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shares one request between concurrent identical calls', async () => {
    const fetchMock = mockFetch(json(200, survey()));
    const store = useSurveysStore();

    const [a, b] = await Promise.all([store.fetchSurvey('s1'), store.fetchSurvey('s1')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('keeps different pages and filters apart', async () => {
    const fetchMock = mockFetch(json(200, paged([summary({ id: 'a' })])), json(200, paged([summary({ id: 'b' })])));
    const store = useSurveysStore();

    await store.fetchList({ scope: 'mine', page: 1 });
    await store.fetchList({ scope: 'mine', page: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.getList({ scope: 'mine', page: 2 })?.items[0]?.id).toBe('b');
  });

  it('a vote updates the survey and patches cached lists without reloading them', async () => {
    const voted = survey({ myVotes: [2], voterCount: 1, totalVotes: 1 });
    const fetchMock = mockFetch(json(200, paged([summary()])), json(200, paged([])), json(200, voted));
    const store = useSurveysStore();
    await store.fetchList({ scope: 'active' });
    await store.fetchList({ scope: 'voted' });

    await store.vote('s1', [2]);

    expect(store.getSurvey('s1')?.myVotes).toEqual([2]);
    const listed = store.getList({ scope: 'active' })!.items[0]!;
    expect(listed.hasVoted).toBe(true);
    expect(listed.voterCount).toBe(1);
    // Active list is still fresh; the "voted" list changed membership and is now stale.
    await store.fetchList({ scope: 'active' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    mockFetch(json(200, paged([summary({ hasVoted: true })])));
    await store.fetchList({ scope: 'voted' });
    expect(store.getList({ scope: 'voted' })!.items).toHaveLength(1);
  });

  it('a failed request leaves the cache untouched and is not cached itself', async () => {
    const fetchMock = mockFetch(json(200, survey()), json(409, { code: 'survey_closed' }), json(200, survey({ status: 'closed' })));
    const store = useSurveysStore();
    await store.fetchSurvey('s1');

    await expect(store.vote('s1', [1])).rejects.toMatchObject({ code: 'survey_closed', status: 409 });

    expect(store.getSurvey('s1')?.myVotes).toEqual([]);
    await store.fetchSurvey('s1', { force: true });
    expect(store.getSurvey('s1')?.status).toBe('closed');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('delete removes the survey from details and every cached list', async () => {
    mockFetch(json(200, paged([summary({ id: 's1' }), summary({ id: 's2' })])), json(200, survey()), json(204));
    const store = useSurveysStore();
    await store.fetchList({ scope: 'mine' });
    await store.fetchSurvey('s1');

    await store.remove('s1');

    expect(store.getSurvey('s1')).toBeUndefined();
    const list = store.getList({ scope: 'mine' })!;
    expect(list.items.map((s) => s.id)).toEqual(['s2']);
    expect(list.total).toBe(1);
  });

  it('reset drops everything', async () => {
    mockFetch(json(200, survey()));
    const store = useSurveysStore();
    await store.fetchSurvey('s1');

    store.reset();

    expect(store.getSurvey('s1')).toBeUndefined();
  });
});
