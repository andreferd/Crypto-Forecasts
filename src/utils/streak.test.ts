import { computeDailyStreak, localDateKey } from './streak';

const DAY = 24 * 60 * 60 * 1000;

function tsDaysAgo(days: number, atHour = 12): number {
  const d = new Date();
  d.setHours(atHour, 0, 0, 0);
  return d.getTime() - days * DAY;
}

describe('computeDailyStreak', () => {
  const now = new Date('2026-04-28T18:00:00');

  it('returns 0 for no predictions', () => {
    expect(computeDailyStreak([], now)).toBe(0);
  });

  it('returns 1 when only today has a prediction', () => {
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);
    expect(computeDailyStreak([today.getTime()], now)).toBe(1);
  });

  it('returns 2 when today and yesterday have predictions', () => {
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(computeDailyStreak([today.getTime(), yesterday.getTime()], now)).toBe(2);
  });

  it('returns 1 with the 1-day grace when only yesterday has a prediction', () => {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(11, 0, 0, 0);
    expect(computeDailyStreak([yesterday.getTime()], now)).toBe(1);
  });

  it('returns 0 when last prediction was day-before-yesterday and nothing since', () => {
    const dby = new Date(now);
    dby.setDate(dby.getDate() - 2);
    dby.setHours(11, 0, 0, 0);
    expect(computeDailyStreak([dby.getTime()], now)).toBe(0);
  });

  it('counts a long streak through today', () => {
    const ts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(10, 0, 0, 0);
      ts.push(d.getTime());
    }
    expect(computeDailyStreak(ts, now)).toBe(7);
  });

  it('breaks the streak on a missed day in the middle', () => {
    // today, yesterday, then skip, then 3 days ago
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeAgo = new Date(now);
    threeAgo.setDate(threeAgo.getDate() - 3);
    expect(
      computeDailyStreak([today.getTime(), yesterday.getTime(), threeAgo.getTime()], now),
    ).toBe(2);
  });

  it('handles multiple predictions on the same day as one', () => {
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);
    const today2 = new Date(now);
    today2.setHours(15, 0, 0, 0);
    expect(computeDailyStreak([today.getTime(), today2.getTime()], now)).toBe(1);
  });

  it('grace rule does not double-count: yesterday only still returns 1, not 2', () => {
    // Regression: ensure grace skips today without incrementing.
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(computeDailyStreak([yesterday.getTime()], now)).toBe(1);
  });

  it('uses local date boundaries, not UTC', () => {
    // A timestamp that is "today" in local time but might be "yesterday" in UTC.
    const localMidnight = new Date(now);
    localMidnight.setHours(0, 30, 0, 0);
    expect(localDateKey(localMidnight)).toBe(localDateKey(now));
  });
});
