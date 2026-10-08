import { defineStore } from 'pinia';
import { ref } from 'vue';
import { surveysApi, type ListQuery } from '@/api';
import type { Paged, SurveyDetails, SurveyInput, SurveyScope, SurveySummary } from '@/api/types';

/** Cached data younger than this is served without a request. */
export const CACHE_TTL_MS = 30_000;

interface Entry<T> {
  data: T;
  fetchedAt: number;
}

export interface FetchOptions {
  /** Ignore the cache and always ask the server. */
  force?: boolean;
}

export function listKey({ scope, status, page = 1 }: ListQuery): string {
  return `${scope}|${status ?? ''}|${page}`;
}

/**
 * Cache of survey lists and survey details.
 *
 * - navigating between pages reuses fresh data instead of refetching it;
 * - identical concurrent requests share one HTTP call;
 * - mutations return the updated survey from the API, which is written into the cache and patched
 *   into every cached list, so nothing has to be reloaded after a vote; lists whose membership may
 *   have changed are only marked stale and refetched when shown next time.
 */
export const useSurveysStore = defineStore('surveys', () => {
  const lists = ref<Record<string, Entry<Paged<SurveySummary>>>>({});
  const details = ref<Record<string, Entry<SurveyDetails>>>({});
  const inflight = new Map<string, Promise<unknown>>();

  const isFresh = (entry: Entry<unknown> | undefined): entry is Entry<unknown> =>
    !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;

  function dedupe<T>(key: string, load: () => Promise<T>): Promise<T> {
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
    const promise = load().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  }

  function getList(query: ListQuery): Paged<SurveySummary> | undefined {
    return lists.value[listKey(query)]?.data;
  }

  function getSurvey(id: string): SurveyDetails | undefined {
    return details.value[id]?.data;
  }

  async function fetchList(query: ListQuery, { force = false }: FetchOptions = {}): Promise<Paged<SurveySummary>> {
    const key = listKey(query);
    const cached = lists.value[key];
    if (!force && isFresh(cached)) return cached.data;
    return dedupe(`list:${key}`, async () => {
      const data = await surveysApi.list(query);
      lists.value[key] = { data, fetchedAt: Date.now() };
      return data;
    });
  }

  async function fetchSurvey(id: string, { force = false }: FetchOptions = {}): Promise<SurveyDetails> {
    const cached = details.value[id];
    if (!force && isFresh(cached)) return cached.data;
    return dedupe(`survey:${id}`, async () => storeSurvey(await surveysApi.get(id)));
  }

  function storeSurvey(survey: SurveyDetails): SurveyDetails {
    details.value[survey.id] = { data: survey, fetchedAt: Date.now() };
    for (const entry of Object.values(lists.value)) {
      const index = entry.data.items.findIndex((item) => item.id === survey.id);
      if (index >= 0) entry.data.items[index] = toSummary(survey);
    }
    return survey;
  }

  /** Marks lists of the given scopes stale: they stay visible but are refetched on next use. */
  function invalidateLists(scopes: SurveyScope[]): void {
    for (const [key, entry] of Object.entries(lists.value)) {
      if (scopes.includes(key.split('|')[0] as SurveyScope)) entry.fetchedAt = 0;
    }
  }

  async function create(input: SurveyInput): Promise<SurveyDetails> {
    const survey = storeSurvey(await surveysApi.create(input));
    invalidateLists(survey.status === 'draft' ? ['mine'] : ['mine', 'active']);
    return survey;
  }

  async function update(id: string, input: SurveyInput): Promise<SurveyDetails> {
    const survey = storeSurvey(await surveysApi.update(id, input));
    invalidateLists(survey.status === 'draft' ? ['mine'] : ['mine', 'active']);
    return survey;
  }

  async function publish(id: string): Promise<SurveyDetails> {
    const survey = storeSurvey(await surveysApi.publish(id));
    invalidateLists(['mine', 'active']);
    return survey;
  }

  async function remove(id: string): Promise<void> {
    await surveysApi.remove(id);
    delete details.value[id];
    for (const entry of Object.values(lists.value)) {
      const before = entry.data.items.length;
      entry.data.items = entry.data.items.filter((item) => item.id !== id);
      if (entry.data.items.length !== before) {
        entry.data.total -= 1;
        entry.fetchedAt = 0;
      }
    }
  }

  async function vote(id: string, optionIds: number[]): Promise<SurveyDetails> {
    const hadVoted = (getSurvey(id)?.myVotes.length ?? 0) > 0;
    const survey = storeSurvey(await surveysApi.vote(id, optionIds));
    if (hadVoted !== survey.myVotes.length > 0) invalidateLists(['voted']);
    return survey;
  }

  async function addOption(id: string, text: string, voteForIt: boolean): Promise<SurveyDetails> {
    const hadVoted = (getSurvey(id)?.myVotes.length ?? 0) > 0;
    const survey = storeSurvey(await surveysApi.addOption(id, text, voteForIt));
    if (hadVoted !== survey.myVotes.length > 0) invalidateLists(['voted']);
    return survey;
  }

  function reset(): void {
    lists.value = {};
    details.value = {};
    inflight.clear();
  }

  return {
    lists,
    details,
    getList,
    getSurvey,
    fetchList,
    fetchSurvey,
    invalidateLists,
    create,
    update,
    publish,
    remove,
    vote,
    addOption,
    reset,
  };
});

export function toSummary(survey: SurveyDetails): SurveySummary {
  return {
    id: survey.id,
    title: survey.title,
    author: survey.author,
    createdAt: survey.createdAt,
    publishedAt: survey.publishedAt,
    deadline: survey.deadline,
    status: survey.status,
    optionCount: survey.options.length,
    voterCount: survey.voterCount,
    hasVoted: survey.myVotes.length > 0,
  };
}
