import { http } from './http';
import type {
  Account, AuthConfig, Credentials, Paged, Registration, SurveyDetails, SurveyInput, SurveyScope, SurveyStatus, SurveySummary,
} from './types';

export const authApi = {
  config: () => http.get<AuthConfig>('/api/auth/config'),
  me: () => http.get<Account>('/api/auth/me'),
  login: (credentials: Credentials) => http.post<Account>('/api/auth/login', credentials),
  register: (registration: Registration) => http.post<Account>('/api/auth/register', registration),
  logout: () => http.post<void>('/api/auth/logout'),
  confirmEmail: (token: string) => http.post<void>('/api/auth/confirm-email', { token }),
  resendConfirmation: () => http.post<void>('/api/auth/resend-confirmation'),
  forgotPassword: (email: string, locale: string) => http.post<void>('/api/auth/forgot-password', { email, locale }),
  resetPassword: (token: string, password: string) => http.post<Account>('/api/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<Account>('/api/auth/change-password', { currentPassword, newPassword }),
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
