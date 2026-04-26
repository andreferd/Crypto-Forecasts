import { computeMarketProbForTarget, evaluatePrediction } from './predictionScoring';
import { PriceBracket } from '../types/market';
import { UserPrediction } from '../types/storage';

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

function prediction(partial: Partial<UserPrediction> = {}): UserPrediction {
  return {
    id: 'p1',
    symbol: 'BTC',
    targetPrice: 100_000,
    direction: 'above',
    marketProbAtTime: 50,
    createdAt: 0,
    ...partial,
  };
}

describe('computeMarketProbForTarget', () => {
  describe('non-overlapping buckets', () => {
    const brackets = [
      bracket({ floorStrike: 0, capStrike: 50_000, probability: 10 }),
      bracket({ floorStrike: 50_000, capStrike: 100_000, probability: 30 }),
      bracket({ floorStrike: 100_000, capStrike: 150_000, probability: 40 }),
      bracket({ floorStrike: 150_000, capStrike: 200_000, probability: 20 }),
    ];

    it('target at a bracket edge sends that bracket entirely above', () => {
      // floor >= target (100_000 >= 100_000) → bracket counts as "above"
      expect(computeMarketProbForTarget(brackets, 100_000, 'above')).toBe(60);
      expect(computeMarketProbForTarget(brackets, 100_000, 'below')).toBe(40);
    });

    it('target below all brackets → almost all above', () => {
      expect(computeMarketProbForTarget(brackets, -1, 'above')).toBe(100);
      expect(computeMarketProbForTarget(brackets, -1, 'below')).toBe(0);
    });

    it('target above all brackets → almost all below', () => {
      expect(computeMarketProbForTarget(brackets, 10_000_000, 'above')).toBe(0);
      expect(computeMarketProbForTarget(brackets, 10_000_000, 'below')).toBe(100);
    });
  });

  describe('proportional split when target falls inside a bracket', () => {
    it('splits one bracket in half at its midpoint', () => {
      const brackets = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 100 }),
      ];
      // midpoint: aboveFraction = (100 - 50) / 100 = 0.5 → 50
      expect(computeMarketProbForTarget(brackets, 50, 'above')).toBe(50);
      expect(computeMarketProbForTarget(brackets, 50, 'below')).toBe(50);
    });

    it('splits proportionally at 25% from bottom', () => {
      const brackets = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 80 }),
      ];
      // aboveFraction = (100 - 25) / 100 = 0.75 → 0.75 * 80 = 60
      expect(computeMarketProbForTarget(brackets, 25, 'above')).toBe(60);
      expect(computeMarketProbForTarget(brackets, 25, 'below')).toBe(20);
    });

    it('combines adjacent brackets with a split on the mid one', () => {
      const brackets = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 20 }),
        bracket({ floorStrike: 100, capStrike: 200, probability: 40 }),
        bracket({ floorStrike: 200, capStrike: 300, probability: 40 }),
      ];
      // target 150 splits mid bracket 50/50: 20 (below) + 40/2 (below) = 40; above = 40 + 40/2 = 60
      expect(computeMarketProbForTarget(brackets, 150, 'above')).toBe(60);
      expect(computeMarketProbForTarget(brackets, 150, 'below')).toBe(40);
    });
  });

  describe('degenerate / edge cases', () => {
    it('returns 50/50 for a zero-range bracket containing the target', () => {
      // floor < target < cap impossible when floor == cap, but code also handles range == 0.
      // Construct: bracket with null floor + null cap → floor=-Inf cap=Inf, so target in range,
      // then range = (null ?? floor*1.2) - (null ?? cap*0.8) = -Infinity - Infinity = -Infinity (<=0) → 50/50
      const brackets = [bracket({ probability: 100 })];
      expect(computeMarketProbForTarget(brackets, 50, 'above')).toBe(50);
      expect(computeMarketProbForTarget(brackets, 50, 'below')).toBe(50);
    });

    it('clamps result to [0, 100]', () => {
      // Even if brackets sum >100 (shouldn't happen) clamp guarantees range.
      const brackets = [
        bracket({ floorStrike: 0, capStrike: 50, probability: 80 }),
        bracket({ floorStrike: 50, capStrike: 100, probability: 80 }),
      ];
      expect(computeMarketProbForTarget(brackets, 0, 'above')).toBe(100);
    });

    it('returns integer (rounded)', () => {
      const brackets = [
        bracket({ floorStrike: 0, capStrike: 3, probability: 100 }),
      ];
      // target 2: aboveFraction = (3 - 2)/3 = 0.333... → 33.33 → rounds to 33
      const above = computeMarketProbForTarget(brackets, 2, 'above');
      expect(Number.isInteger(above)).toBe(true);
      expect(above).toBe(33);
    });

    it('empty bracket list returns 0', () => {
      expect(computeMarketProbForTarget([], 100, 'above')).toBe(0);
      expect(computeMarketProbForTarget([], 100, 'below')).toBe(0);
    });

    it('handles null floor as -Infinity (entirely below target if cap <= target)', () => {
      const brackets = [
        bracket({ floorStrike: null, capStrike: 50, probability: 100 }),
      ];
      expect(computeMarketProbForTarget(brackets, 100, 'below')).toBe(100);
      expect(computeMarketProbForTarget(brackets, 100, 'above')).toBe(0);
    });

    it('handles null cap as Infinity (entirely above target if floor >= target)', () => {
      const brackets = [
        bracket({ floorStrike: 100, capStrike: null, probability: 100 }),
      ];
      expect(computeMarketProbForTarget(brackets, 50, 'above')).toBe(100);
      expect(computeMarketProbForTarget(brackets, 50, 'below')).toBe(0);
    });
  });
});

describe('evaluatePrediction', () => {
  const brackets = [
    bracket({ floorStrike: 0, capStrike: 100_000, probability: 30 }),
    bracket({ floorStrike: 100_000, capStrike: 200_000, probability: 70 }),
  ];

  describe('marketAgreement', () => {
    it('agrees when market prob for prediction direction is >= 55', () => {
      // above 100k: bracket two (70) → 70 ≥ 55 → agrees
      const res = evaluatePrediction(prediction({ direction: 'above' }), null, brackets);
      expect(res.currentMarketProb).toBe(70);
      expect(res.marketAgreement).toBe('agrees');
    });

    it('disagrees when market prob <= 45', () => {
      // below 100k: bracket one (30) → ≤ 45 → disagrees
      const res = evaluatePrediction(prediction({ direction: 'below' }), null, brackets);
      expect(res.currentMarketProb).toBe(30);
      expect(res.marketAgreement).toBe('disagrees');
    });

    it('neutral when market prob is strictly between 45 and 55', () => {
      const evenBrackets = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 50 }),
        bracket({ floorStrike: 100, capStrike: 200, probability: 50 }),
      ];
      const res = evaluatePrediction(
        prediction({ targetPrice: 100, direction: 'above' }),
        null,
        evenBrackets,
      );
      expect(res.currentMarketProb).toBe(50);
      expect(res.marketAgreement).toBe('neutral');
    });

    it('55 exactly → agrees (boundary inclusive)', () => {
      const b = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 45 }),
        bracket({ floorStrike: 100, capStrike: 200, probability: 55 }),
      ];
      const res = evaluatePrediction(
        prediction({ targetPrice: 100, direction: 'above' }),
        null,
        b,
      );
      expect(res.marketAgreement).toBe('agrees');
    });

    it('45 exactly → disagrees (boundary inclusive)', () => {
      const b = [
        bracket({ floorStrike: 0, capStrike: 100, probability: 55 }),
        bracket({ floorStrike: 100, capStrike: 200, probability: 45 }),
      ];
      const res = evaluatePrediction(
        prediction({ targetPrice: 100, direction: 'above' }),
        null,
        b,
      );
      expect(res.marketAgreement).toBe('disagrees');
    });
  });

  describe('hypotheticalResult', () => {
    it('null spot → unknown', () => {
      const res = evaluatePrediction(prediction(), null, brackets);
      expect(res.hypotheticalResult).toBe('unknown');
    });

    it('above prediction, spot ≥ target → correct', () => {
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'above' }),
        120_000,
        brackets,
      );
      expect(res.hypotheticalResult).toBe('correct');
    });

    it('above prediction, spot < target → incorrect', () => {
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'above' }),
        90_000,
        brackets,
      );
      expect(res.hypotheticalResult).toBe('incorrect');
    });

    it('below prediction, spot < target → correct', () => {
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'below' }),
        90_000,
        brackets,
      );
      expect(res.hypotheticalResult).toBe('correct');
    });

    it('below prediction, spot ≥ target → incorrect', () => {
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'below' }),
        100_000,
        brackets,
      );
      expect(res.hypotheticalResult).toBe('incorrect');
    });
  });

  describe('brierScore', () => {
    it('0 when forecast was confident and correct', () => {
      // direction above 100k → market prob = 70 → forecast 0.70
      // spot 150k → correct → outcome 1 → (0.70 - 1)^2 = 0.09
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'above' }),
        150_000,
        brackets,
      );
      expect(res.brierScore).toBeCloseTo(0.09, 3);
    });

    it('rounded to 3 decimals', () => {
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'above' }),
        150_000,
        brackets,
      );
      expect(res.brierScore.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(3);
    });

    it('unknown outcome uses 0.5', () => {
      // forecast = 70/100 = 0.7; outcome = 0.5 → (0.7 - 0.5)^2 = 0.04
      const res = evaluatePrediction(
        prediction({ targetPrice: 100_000, direction: 'above' }),
        null,
        brackets,
      );
      expect(res.brierScore).toBeCloseTo(0.04, 3);
    });

    it('passes the original prediction through in the result', () => {
      const p = prediction({ id: 'abc-123' });
      const res = evaluatePrediction(p, null, brackets);
      expect(res.prediction).toBe(p);
    });
  });
});
