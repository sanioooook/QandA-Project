import { describe, expect, it } from 'vitest';
import { clock, composeDeadline, effectiveStatus, remaining, splitDeadline } from './deadline';

describe('deadline', () => {
  it('a date without a time means the end of that day in local time', () => {
    const deadline = composeDeadline('2026-10-22', '')!;

    expect([deadline.getFullYear(), deadline.getMonth(), deadline.getDate()]).toEqual([2026, 9, 22]);
    expect([deadline.getHours(), deadline.getMinutes(), deadline.getSeconds(), deadline.getMilliseconds()]).toEqual([23, 59, 59, 999]);
  });

  it('a date with a time uses that time to the minute', () => {
    const deadline = composeDeadline('2026-10-22', '18:30')!;

    expect([deadline.getHours(), deadline.getMinutes(), deadline.getSeconds()]).toEqual([18, 30, 0]);
  });

  it('no date means no deadline, even if a time was entered', () => {
    expect(composeDeadline('', '18:30')).toBeNull();
    expect(composeDeadline('not-a-date', '')).toBeNull();
  });

  it('round-trips through the form fields', () => {
    expect(splitDeadline(composeDeadline('2026-10-22', '')!.toISOString())).toEqual({ date: '2026-10-22', time: '' });
    expect(splitDeadline(composeDeadline('2026-10-22', '09:05')!.toISOString())).toEqual({ date: '2026-10-22', time: '09:05' });
    expect(splitDeadline(null)).toEqual({ date: '', time: '' });
  });

  it('counts down and never goes negative', () => {
    const now = Date.parse('2026-10-20T10:00:00Z');

    const left = remaining('2026-10-22T12:34:56Z', now);

    expect(left).toMatchObject({ days: 2, hours: 2, minutes: 34, seconds: 56 });
    expect(clock(left)).toBe('02:34:56');
    expect(remaining('2026-10-19T00:00:00Z', now).totalMs).toBe(0);
  });

  it('an active survey whose deadline passed on the client is shown as closed', () => {
    const now = Date.parse('2026-10-20T10:00:00Z');

    expect(effectiveStatus('active', '2026-10-20T09:59:59Z', now)).toBe('closed');
    expect(effectiveStatus('active', '2026-10-20T10:00:01Z', now)).toBe('active');
    expect(effectiveStatus('active', null, now)).toBe('active');
    expect(effectiveStatus('draft', '2026-10-01T00:00:00Z', now)).toBe('draft');
  });
});
