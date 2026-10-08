// Mirrors the DTOs of Server/src/QandA.Api (camelCase JSON, enums as camelCase strings).

export interface User {
  id: number;
  login: string;
}

export type SurveyStatus = 'draft' | 'active' | 'closed';
export type SurveyScope = 'active' | 'mine' | 'voted';

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SurveySummary {
  id: string;
  title: string;
  author: User;
  createdAt: string;
  publishedAt: string | null;
  deadline: string | null;
  status: SurveyStatus;
  optionCount: number;
  voterCount: number;
  hasVoted: boolean;
}

export interface Voter {
  userId: number;
  login: string;
  votedAt: string;
}

export interface SurveyOption {
  id: number;
  text: string;
  votes: number;
  addedBy: string | null;
  /** Only present for the survey author. */
  voters: Voter[] | null;
}

export interface SurveyDetails {
  id: string;
  title: string;
  description: string | null;
  author: User;
  createdAt: string;
  publishedAt: string | null;
  deadline: string | null;
  status: SurveyStatus;
  maxVotesPerUser: number;
  allowParticipantOptions: boolean;
  maxOptionsPerParticipant: number;
  isAuthor: boolean;
  voterCount: number;
  totalVotes: number;
  myVotes: number[];
  myAddedOptions: number;
  canVote: boolean;
  canAddOption: boolean;
  options: SurveyOption[];
}

export interface SurveyInput {
  title: string;
  description: string | null;
  options: string[];
  deadline: string | null;
  maxVotesPerUser: number;
  allowParticipantOptions: boolean;
  maxOptionsPerParticipant: number;
  publish: boolean;
}

export interface Credentials {
  login: string;
  password: string;
}
