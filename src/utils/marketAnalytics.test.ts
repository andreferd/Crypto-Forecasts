import {
  computeConfidence,
  generateMarketSummary,
  computeProbabilityBands,
  computeSpotDelta,
  computeTrend,
} from './marketAnalytics';
import { PriceBracket } from '../types/market';
import { ForecastPoint } from '../services/forecastHistory';

function bracket(partial: Partial<PriceBracket>): PriceBracket {
  return {
    ticker: 'T',
    label: 'L',
    floorStrike: null,
    capStrike: null,
    probability: 0,
    displayRange: '',
    volume: 0,
    openInterest: 0,
    ...partial,
  };
}

describe('computeConfidence', () => {
  it('returns 0 for empty bracket list', () => {
    expect(computeConfidence([])).toBe(0);
  });

  it('returns 0 for a single bracket (no distribution)', () => {
    expect(computeConfidence([bracket({ probability: 100 })])).toBe(0);
  });

  it('returns 0 when probabilities sum to 0', () => {
    expect(
      computeConfidence([bracket({ probability: 0 }), bracket({ probability: 0 })]),
    ).toBe(0);
  });

  it('returns 100 when all probability is in one bracket', () => {
    expect(
      computeConfidence([
        bracket({ probability: 100 }),
        bracket({ probability: 0 }),
        bracket({ probability: 0 }),
      ]),
    ).toBe(100);
  });

  it('returns 0 for a fully uniform distribution', () => {
    expect(
      computeConfidence([
        bracket({ probability: 25 }),
        bracket({ probability: 25 }),
        bracket({ probability: 25 }),
        bracket({ probability: 25 }),
      ]),
    ).toBe(0);
  });

  it('returns a mid-range value for a skewed distribution', () => {
    const c = computeConfidence([
      bracket({ probability: 80 }),
      bracket({ probability: 10 }),
      bracket({ probability: 10 }),
    ]);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(100);
  });

  it('is invariant to scaling of raw probabilities (normalized internally)', () => {
    const a = computeConfidence([
      bracket({ probability: 50 }),
      bracket({ probability: 50 }),
    ]);
    const b = computeConfidence([
      bracket({ probability: 1 }),
      bracket({ probability: 1 }),
    ]);
    expect(a).toBe(b);
  });
});

describe('computeProbabilityBands', () => {
  it('returns nulls for empty input', () => {
    expect(computeProbabilityBands([])).toEqual({ range50: null, range80: null });
  });

  it('returns nulls when total probability is 0', () => {
    expect(
      computeProbabilityBands([
        bracket({ probability: 0, floorStrike: 0, capStrike: 100 }),
      ]),
    ).toEqual({ range50: null, range80: null });
  });

  it('returns nulls when no bracket has strike info', () => {
    expect(
      computeProbabilityBands([bracket({ probability: 100 })]),
    ).toEqual({ range50: null, range80: null });
  });

  it('picks the central bucket(s) for range50 and widens for range80', () => {
    const brackets = [
      bracket({ floorStrike: 0, capStrike: 100, probability: 20 }),
      bracket({ floorStrike: 100, capStrike: 200, probability: 30 }),
      bracket({ floorStrike: 200, capStrike: 300, probability: 30 }),
      bracket({ floorStrike: 300, capStrike: 400, probability: 20 }),
    ];
    const { range50, range80 } = computeProbabilityBands(brackets);
    expect(range50).toEqual({ low: 100, high: 300 });
    expect(range80).toEqual({ low: 0, high: 400 });
  });

  it('returns null for a band when collapsed to a single bucket (high <= low)', () => {
    const brackets = [
      bracket({ floorStrike: 100, capStrike: 200, probability: 100 }),
    ];
    const { range50 } = computeProbabilityBands(brackets);
    // single bucket, both lowIdx and highIdx converge, so high (200) > low (100)
    expect(range50).toEqual({ low: 100, high: 200 });
  });
});

describe('computeSpotDelta', () => {
  const brackets = [
    bracket({ floorStrike: 0, capStrike: 100, probability: 50 }),
    bracket({ floorStrike: 100, capStrike: 200, probability: 50 }),
  ];

  it('returns null when brackets sum to 0', () => {
    expect(computeSpotDelta(100, [bracket({ probability: 0 })])).toBeNull();
  });

  it('returns null when spot is 0', () => {
    expect(computeSpotDelta(0, brackets)).toBeNull();
  });

  it('direction "above" when spot > expected', () => {
    // expected = 100 (midpoint of 50 + 150)
    const d = computeSpotDelta(150, brackets);
    expect(d?.direction).toBe('above');
    expect(d?.delta).toBe(50);
    expect(d?.deltaPercent).toBe(50);
  });

  it('direction "below" when spot < expected', () => {
    const d = computeSpotDelta(50, brackets);
    expect(d?.direction).toBe('below');
    expect(d?.delta).toBe(-50);
  });

  it('direction "at" when spot ≈ expected', () => {
    const d = computeSpotDelta(100, brackets);
    expect(d?.direction).toBe('at');
  });
});

describe('computeTrend', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = 1_700_000_000_000;

  function point(daysAgo: number, forecast: number): ForecastPoint {
    return { timestamp: now - daysAgo * DAY, forecast };
  }

  it('returns null when fewer than 2 points', () => {
    expect(computeTrend([])).toBeNull();
    expect(computeTrend([point(0, 100)])).toBeNull();
  });

  it('returns up when current > week-ago by more than 1%', () => {
    const history = [point(7, 100), point(0, 110)];
    const t = computeTrend(history);
    expect(t?.direction).toBe('up');
    expect(t?.changePercent).toBe(10);
  });

  it('returns down when current < week-ago by more than 1%', () => {
    const history = [point(7, 100), point(0, 90)];
    expect(computeTrend(history)?.direction).toBe('down');
  });

  it('returns flat when change within ±1%', () => {
    const history = [point(7, 100), point(0, 100.5)];
    expect(computeTrend(history)?.direction).toBe('flat');
  });

  it('picks the point closest to 7 days ago (not just the first)', () => {
    const history = [
      point(30, 50), // far
      point(8, 100), // closer than 7-day target than point(1)
      point(1, 105),
      point(0, 110),
    ];
    // Current 110, closest-to-7d is point at 8d (100) → +10%
    expect(computeTrend(history)?.changePercent).toBe(10);
  });

  it('returns null when the reference forecast is 0', () => {
    const history = [point(7, 0), point(0, 100)];
    expect(computeTrend(history)).toBeNull();
  });
});

describe('generateMarketSummary', () => {
  it('reports "no data" for empty brackets', () => {
    expect(generateMarketSummary('BTC', [])).toMatch(/No consensus data/);
  });

  it('reports "no data" when total probability is 0', () => {
    expect(
      generateMarketSummary('BTC', [
        bracket({ probability: 0, floorStrike: 0, capStrike: 100 }),
      ]),
    ).toMatch(/No consensus data/);
  });

  it('includes the best bracket percentage and display range', () => {
    const summary = generateMarketSummary('BTC', [
      bracket({
        floorStrike: 0,
        capStrike: 100_000,
        probability: 30,
        displayRange: '< $100k',
      }),
      bracket({
        floorStrike: 100_000,
        capStrike: 200_000,
        probability: 70,
        displayRange: '$100k - $200k',
      }),
    ]);
    expect(summary).toMatch(/70% chance BTC ends between \$100k - \$200k/);
  });

  it('appends spot comparison when spotPrice is provided', () => {
    const brackets = [
      bracket({ floorStrike: 0, capStrike: 100, probability: 50 }),
      bracket({ floorStrike: 100, capStrike: 200, probability: 50 }),
    ];
    // expected = 100, spot 120 → +20%
    const summary = generateMarketSummary('X', brackets, 120);
    expect(summary).toMatch(/Spot is 20\.0% above expected/);
  });

  it('omits spot comparison when spotPrice is null', () => {
    const brackets = [
      bracket({ floorStrike: 0, capStrike: 100, probability: 100 }),
    ];
    expect(generateMarketSummary('X', brackets, null)).not.toMatch(/Spot/);
  });
});
