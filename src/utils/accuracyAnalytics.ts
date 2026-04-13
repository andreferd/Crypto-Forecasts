import { DailyAccuracyEntry, AccuracyMetrics, WeeklyReportCard } from '../types/storage';

export function computeAccuracyMetrics(
  symbol: string,
  entries: DailyAccuracyEntry[],
): AccuracyMetrics {
  const symbolEntries = entries.filter((e) => e.symbol === symbol);

  if (symbolEntries.length === 0) {
    return {
      symbol,
      meanAbsoluteError: 0,
      meanPercentError: 0,
      brierLikeScore: 0,
      daysTracked: 0,
      latestEntry: null,
    };
  }

  let totalAbsError = 0;
  let totalPercentError = 0;
  let totalBrier = 0;

  for (const entry of symbolEntries) {
    const absError = Math.abs(entry.expectedValue - entry.spotPrice);
    const percentError = entry.spotPrice > 0
      ? (absError / entry.spotPrice) * 100
      : 0;
    // Brier-like: normalized squared error
    const normalizedError = entry.spotPrice > 0
      ? (entry.expectedValue - entry.spotPrice) / entry.spotPrice
      : 0;
    totalAbsError += absError;
    totalPercentError += percentError;
    totalBrier += normalizedError * normalizedError;
  }

  const n = symbolEntries.length;
  const sorted = [...symbolEntries].sort((a, b) => b.timestamp - a.timestamp);

  return {
    symbol,
    meanAbsoluteError: Math.round(totalAbsError / n),
    meanPercentError: Math.round((totalPercentError / n) * 10) / 10,
    brierLikeScore: Math.round((totalBrier / n) * 1000) / 1000,
    daysTracked: n,
    latestEntry: sorted[0] ?? null,
  };
}

export function computeWeeklyReports(
  entries: DailyAccuracyEntry[],
  symbols: string[],
): WeeklyReportCard[] {
  if (entries.length === 0) return [];

  // Group entries by ISO week
  const weekMap = new Map<string, DailyAccuracyEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.date);
    const weekStart = getWeekStart(date);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(entry);
  }

  const reports: WeeklyReportCard[] = [];

  for (const [weekStartStr, weekEntries] of weekMap) {
    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let totalError = 0;
    let totalPercentError = 0;
    let count = 0;

    const symbolErrors = new Map<string, { totalError: number; totalPercent: number; count: number }>();

    for (const entry of weekEntries) {
      const absError = Math.abs(entry.expectedValue - entry.spotPrice);
      const percentError = entry.spotPrice > 0 ? (absError / entry.spotPrice) * 100 : 0;
      totalError += absError;
      totalPercentError += percentError;
      count++;

      if (!symbolErrors.has(entry.symbol)) {
        symbolErrors.set(entry.symbol, { totalError: 0, totalPercent: 0, count: 0 });
      }
      const se = symbolErrors.get(entry.symbol)!;
      se.totalError += absError;
      se.totalPercent += percentError;
      se.count++;
    }

    if (count === 0) continue;

    reports.push({
      weekStart: weekStartStr,
      weekEnd: weekEnd.toISOString().slice(0, 10),
      avgError: Math.round(totalError / count),
      avgPercentError: Math.round((totalPercentError / count) * 10) / 10,
      symbolBreakdown: symbols
        .filter((s) => symbolErrors.has(s))
        .map((s) => {
          const se = symbolErrors.get(s)!;
          return {
            symbol: s,
            avgError: Math.round(se.totalError / se.count),
            avgPercentError: Math.round((se.totalPercent / se.count) * 10) / 10,
          };
        }),
    });
  }

  // Sort newest first
  reports.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return reports;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
