import { http } from './http';
import type { Credentials, Paged, SurveyDetails, SurveyInput, SurveyScope, SurveyStatus, SurveySummary, User } from './types';

export const authApi = {
  me: () => http.get<User>('/api/auth/me'),
  login: (credentials: Credentials) => http.post<User>('/api/auth/login', credentials),
  register: (credentials: Credentials) => http.post<User>('/api/auth/register', credentials),
  logout: () => http.post<void>('/api/auth/logout'),
};

export interface ListQuery {
  scope: SurveyScope;
  status?: SurveyStatus | null;
  page?: number;
  pageSize?: number;
}

export const surveysApi = {
  list: ({ scope, status, page = 1, pageSize = 20 }: ListQuery) => {
    const params = new URLSearchParams({ scope, page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    return http.get<Paged<SurveySummary>>(`/api/surveys?${params}`);
  },
  get: (id: string) => http.get<SurveyDetails>(`/api/surveys/${id}`),
  create: (input: SurveyInput) => http.post<SurveyDetails>('/api/surveys', input),
  update: (id: string, input: SurveyInput) => http.put<SurveyDetails>(`/api/surveys/${id}`, input),
  publish: (id: string) => http.post<SurveyDetails>(`/api/surveys/${id}/publish`),
  remove: (id: string) => http.delete(`/api/surveys/${id}`),
  vote: (id: string, optionIds: number[]) => http.put<SurveyDetails>(`/api/surveys/${id}/votes`, { optionIds }),
  addOption: (id: string, text: string, vote: boolean) =>
    http.post<SurveyDetails>(`/api/surveys/${id}/options`, { text, vote }),
};
