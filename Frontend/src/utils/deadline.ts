import type { SurveyStatus } from '@/api/types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Deadline from the form: the date is required, the time optional.
 * Without a time the survey runs to the very end of that day (23:59:59.999 local time).
 */
export function composeDeadline(date: string, time: string): Date | null {
  if (!date) return null;
  const result = new Date(`${date}T${time || '23:59:59.999'}`);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** Inverse of composeDeadline: an end-of-day deadline is shown as a date without a time. */
export function splitDeadline(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const endOfDay = d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59;
  return { date, time: endOfDay ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** `yyyy-mm-dd` of today in local time, for the `min` of the date input. */
export function todayInput(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function remaining(deadline: string, now: number): Remaining {
  const totalMs = Math.max(0, new Date(deadline).getTime() - now);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

export function clock({ hours, minutes, seconds }: Remaining): string {
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * The server decides the status when the data is fetched; a survey can close while it is on screen.
 * Treat an active survey whose deadline has passed on the client clock as closed.
 */
export function effectiveStatus(status: SurveyStatus, deadline: string | null, now: number): SurveyStatus {
  return status === 'active' && deadline !== null && new Date(deadline).getTime() <= now ? 'closed' : status;
}
