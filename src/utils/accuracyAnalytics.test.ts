import { computeAccuracyMetrics, computeWeeklyReports } from './accuracyAnalytics';
import { DailyAccuracyEntry } from '../types/storage';

function entry(partial: Partial<DailyAccuracyEntry>): DailyAccuracyEntry {
  return {
    date: '2026-03-02',
    symbol: 'BTC',
    expectedValue: 100_000,
    spotPrice: 100_000,
    timestamp: new Date(partial.date ?? '2026-03-02').getTime(),
    ...partial,
  };
}

describe('computeAccuracyMetrics', () => {
  it('returns zeros when there are no entries for the symbol', () => {
    const m = computeAccuracyMetrics('BTC', []);
    expect(m).toEqual({
      symbol: 'BTC',
      meanAbsoluteError: 0,
      meanPercentError: 0,
      brierLikeScore: 0,
      daysTracked: 0,
      latestEntry: null,
    });
  });

  it('filters entries to the requested symbol', () => {
    const entries = [
      entry({ symbol: 'BTC', expectedValue: 100, spotPrice: 100 }),
      entry({ symbol: 'ETH', expectedValue: 200, spotPrice: 100 }), // ignored
    ];
    const m = computeAccuracyMetrics('BTC', entries);
    expect(m.daysTracked).toBe(1);
    expect(m.meanAbsoluteError).toBe(0);
  });

  it('computes MAE as integer-rounded mean absolute error', () => {
    const entries = [
      entry({ expectedValue: 110, spotPrice: 100 }), // |10| = 10
      entry({ expectedValue: 80, spotPrice: 100 }),  // |−20| = 20
    ];
    expect(computeAccuracyMetrics('BTC', entries).meanAbsoluteError).toBe(15);
  });

  it('computes meanPercentError rounded to one decimal', () => {
    const entries = [
      entry({ expectedValue: 110, spotPrice: 100 }), // 10%
      entry({ expectedValue: 85, spotPrice: 100 }),  // 15%
    ];
    expect(computeAccuracyMetrics('BTC', entries).meanPercentError).toBe(12.5);
  });

  it('computes brierLikeScore rounded to 3 decimals', () => {
    const entries = [
      entry({ expectedValue: 110, spotPrice: 100 }), // (0.1)^2 = 0.01
      entry({ expectedValue: 90, spotPrice: 100 }),  // (−0.1)^2 = 0.01
    ];
    expect(computeAccuracyMetrics('BTC', entries).brierLikeScore).toBe(0.01);
  });

  it('treats zero spot price as zero percent error (not NaN/Infinity)', () => {
    const entries = [entry({ expectedValue: 100, spotPrice: 0 })];
    const m = computeAccuracyMetrics('BTC', entries);
    expect(m.meanPercentError).toBe(0);
    expect(m.brierLikeScore).toBe(0);
  });

  it('latestEntry is the newest by timestamp', () => {
    const entries = [
      entry({ date: '2026-03-01', timestamp: 1000 }),
      entry({ date: '2026-03-02', timestamp: 3000 }),
      entry({ date: '2026-03-03', timestamp: 2000 }),
    ];
    const m = computeAccuracyMetrics('BTC', entries);
    expect(m.latestEntry?.timestamp).toBe(3000);
  });
});

describe('computeWeeklyReports', () => {
  it('returns empty array for empty input', () => {
    expect(computeWeeklyReports([], ['BTC'])).toEqual([]);
  });

  it('groups entries within the same ISO week (Monday start)', () => {
    // 2026-03-02 is a Monday (UTC); 03-04 Wednesday; 03-08 Sunday
    const entries = [
      entry({ date: '2026-03-02', expectedValue: 110, spotPrice: 100 }),
      entry({ date: '2026-03-04', expectedValue: 90, spotPrice: 100 }),
      entry({ date: '2026-03-08', expectedValue: 100, spotPrice: 100 }),
    ];
    const reports = computeWeeklyReports(entries, ['BTC']);
    expect(reports).toHaveLength(1);
    expect(reports[0].weekStart).toBe('2026-03-02');
    expect(reports[0].weekEnd).toBe('2026-03-08');
  });

  it('separates entries in different weeks, newest first', () => {
    const entries = [
      entry({ date: '2026-03-02' }), // week of 03-02
      entry({ date: '2026-03-09' }), // week of 03-09
    ];
    const reports = computeWeeklyReports(entries, ['BTC']);
    expect(reports).toHaveLength(2);
    expect(reports[0].weekStart).toBe('2026-03-09');
    expect(reports[1].weekStart).toBe('2026-03-02');
  });

  it('averages errors across entries in a week', () => {
    const entries = [
      entry({ date: '2026-03-02', expectedValue: 110, spotPrice: 100 }), // 10, 10%
      entry({ date: '2026-03-03', expectedValue: 80, spotPrice: 100 }),  // 20, 20%
    ];
    const [report] = computeWeeklyReports(entries, ['BTC']);
    expect(report.avgError).toBe(15);
    expect(report.avgPercentError).toBe(15);
  });

  it('symbolBreakdown includes only symbols in the requested list that have data', () => {
    const entries = [
      entry({ date: '2026-03-02', symbol: 'BTC', expectedValue: 110, spotPrice: 100 }),
      entry({ date: '2026-03-03', symbol: 'ETH', expectedValue: 95, spotPrice: 100 }),
    ];
    const [report] = computeWeeklyReports(entries, ['BTC', 'ETH', 'SOL']);
    const symbols = report.symbolBreakdown.map((s) => s.symbol);
    expect(symbols).toEqual(['BTC', 'ETH']); // SOL absent
  });

  it('handles Sunday dates by rolling back to previous Monday', () => {
    // 2026-03-01 is Sunday UTC → should land in week starting 2026-02-23
    const entries = [entry({ date: '2026-03-01' })];
    const reports = computeWeeklyReports(entries, ['BTC']);
    expect(reports[0].weekStart).toBe('2026-02-23');
  });
});
