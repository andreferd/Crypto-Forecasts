import {
  bracketToSnapshot,
  forecastToSymbolSnapshot,
  computeBracketDiffs,
  computeSymbolDigest,
  computeFullDigest,
  buildCurrentSnapshot,
} from './digestAnalytics';
import { PriceBracket, ForecastSeries } from '../types/market';
import { BracketSnapshot, SymbolSnapshot } from '../types/storage';

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

function snap(partial: Partial<BracketSnapshot>): BracketSnapshot {
  return {
    ticker: 'T',
    displayRange: '',
    probability: 0,
    floorStrike: null,
    capStrike: null,
    ...partial,
  };
}

function series(type: ForecastSeries['type'], partial: Partial<ForecastSeries> = {}): ForecastSeries {
  return {
    type,
    label: type,
    seriesTicker: 'S',
    brackets: [],
    mostLikelyBracket: null,
    expectedValue: null,
    ...partial,
  };
}

describe('bracketToSnapshot', () => {
  it('extracts only the snapshot fields', () => {
    const b = bracket({
      ticker: 'X',
      displayRange: '$10k - $20k',
      probability: 40,
      floorStrike: 10_000,
      capStrike: 20_000,
      volume: 999,
      openInterest: 50,
    });
    expect(bracketToSnapshot(b)).toEqual({
      ticker: 'X',
      displayRange: '$10k - $20k',
      probability: 40,
      floorStrike: 10_000,
      capStrike: 20_000,
    });
  });
});

describe('forecastToSymbolSnapshot', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('picks the eoy series and uses its expectedValue and brackets', () => {
    const eoy = series('eoy', {
      expectedValue: 150_000,
      brackets: [bracket({ ticker: 'A', probability: 50, displayRange: 'r', floorStrike: 0, capStrike: 100_000 })],
    });
    const max = series('max', { expectedValue: 999_999 });
    const out = forecastToSymbolSnapshot('BTC', [max, eoy]);
    expect(out.symbol).toBe('BTC');
    expect(out.expectedValue).toBe(150_000);
    expect(out.brackets).toHaveLength(1);
    expect(out.brackets[0].ticker).toBe('A');
    expect(out.timestamp).toBe(1_700_000_000_000);
  });

  it('falls back to null / [] when there is no eoy series', () => {
    const out = forecastToSymbolSnapshot('BTC', [series('max')]);
    expect(out.expectedValue).toBeNull();
    expect(out.brackets).toEqual([]);
  });
});

describe('computeBracketDiffs', () => {
  it('finds probability changes and ignores unchanged brackets', () => {
    const old: BracketSnapshot[] = [
      snap({ displayRange: 'A', probability: 30 }),
      snap({ displayRange: 'B', probability: 40 }),
    ];
    const next: BracketSnapshot[] = [
      snap({ displayRange: 'A', probability: 30 }), // unchanged
      snap({ displayRange: 'B', probability: 50 }), // +10
    ];
    const diffs = computeBracketDiffs(old, next);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ displayRange: 'B', oldProb: 40, newProb: 50, delta: 10 });
  });

  it('treats a brand-new bracket as oldProb 0', () => {
    const diffs = computeBracketDiffs([], [snap({ displayRange: 'A', probability: 25 })]);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ oldProb: 0, newProb: 25, delta: 25 });
  });

  it('emits a negative-delta entry for brackets that disappeared', () => {
    const diffs = computeBracketDiffs(
      [snap({ displayRange: 'gone', probability: 20 })],
      [],
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ oldProb: 20, newProb: 0, delta: -20 });
  });

  it('sorts by absolute delta descending', () => {
    const old = [
      snap({ displayRange: 'small', probability: 10 }),
      snap({ displayRange: 'big', probability: 40 }),
    ];
    const next = [
      snap({ displayRange: 'small', probability: 12 }),  // +2
      snap({ displayRange: 'big', probability: 20 }),    // -20
    ];
    const diffs = computeBracketDiffs(old, next);
    expect(diffs.map((d) => d.displayRange)).toEqual(['big', 'small']);
  });
});

describe('computeSymbolDigest', () => {
  it('builds evDelta from old and new expected values', () => {
    const oldSnap: SymbolSnapshot = {
      symbol: 'BTC',
      expectedValue: 100_000,
      brackets: [snap({ displayRange: 'A', probability: 50 })],
      timestamp: 0,
    };
    const newSnap: SymbolSnapshot = {
      symbol: 'BTC',
      expectedValue: 110_000,
      brackets: [snap({ displayRange: 'A', probability: 55 })],
      timestamp: 1,
    };
    const d = computeSymbolDigest('BTC', oldSnap, newSnap);
    expect(d.oldExpectedValue).toBe(100_000);
    expect(d.newExpectedValue).toBe(110_000);
    expect(d.expectedValueDelta).toBe(10_000);
    expect(d.biggestMover?.displayRange).toBe('A');
  });

  it('leaves evDelta null when either side is missing', () => {
    const newSnap: SymbolSnapshot = {
      symbol: 'BTC',
      expectedValue: 110_000,
      brackets: [],
      timestamp: 1,
    };
    const d = computeSymbolDigest('BTC', undefined, newSnap);
    expect(d.oldExpectedValue).toBeNull();
    expect(d.expectedValueDelta).toBeNull();
    expect(d.biggestMover).toBeNull();
  });
});

describe('computeFullDigest', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sorts digests by absolute expected-value delta descending', () => {
    const old = {
      symbols: [
        { symbol: 'BTC', expectedValue: 100_000, brackets: [], timestamp: 0 },
        { symbol: 'ETH', expectedValue: 3000, brackets: [], timestamp: 0 },
        { symbol: 'SOL', expectedValue: 150, brackets: [], timestamp: 0 },
      ],
      timestamp: 0,
    };
    const current = [
      { symbol: 'BTC', forecasts: [series('eoy', { expectedValue: 101_000 })] }, // +1000
      { symbol: 'ETH', forecasts: [series('eoy', { expectedValue: 5000 })] },    // +2000
      { symbol: 'SOL', forecasts: [series('eoy', { expectedValue: 160 })] },     // +10
    ];
    const digests = computeFullDigest(old, current);
    expect(digests.map((d) => d.symbol)).toEqual(['ETH', 'BTC', 'SOL']);
  });

  it('handles a null previous snapshot (everything is new)', () => {
    const digests = computeFullDigest(null, [
      { symbol: 'BTC', forecasts: [series('eoy', { expectedValue: 100_000 })] },
    ]);
    expect(digests).toHaveLength(1);
    expect(digests[0].oldExpectedValue).toBeNull();
  });
});

describe('buildCurrentSnapshot', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(42);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('produces a snapshot for each input symbol with a shared Date.now timestamp', () => {
    const snap = buildCurrentSnapshot([
      { symbol: 'BTC', forecasts: [series('eoy', { expectedValue: 100 })] },
      { symbol: 'ETH', forecasts: [series('eoy', { expectedValue: 3 })] },
    ]);
    expect(snap.timestamp).toBe(42);
    expect(snap.symbols.map((s) => s.symbol)).toEqual(['BTC', 'ETH']);
    expect(snap.symbols[0].expectedValue).toBe(100);
  });
});
