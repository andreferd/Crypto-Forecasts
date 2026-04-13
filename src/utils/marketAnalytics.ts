import { PriceBracket } from '../types/market';
import { ForecastPoint } from '../services/forecastHistory';

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

/**
 * Shannon entropy-based confidence score (0-100).
 * Higher = market is more concentrated/confident.
 */
export function computeConfidence(brackets: PriceBracket[]): number {
  const total = brackets.reduce((s, b) => s + b.probability, 0);
  if (total === 0 || brackets.length < 2) return 0;

  // Normalize probabilities to sum to 1
  const probs = brackets.map((b) => b.probability / total);

  // Shannon entropy: H = -sum(p * log2(p))
  let H = 0;
  for (const p of probs) {
    if (p > 0) {
      H -= p * Math.log2(p);
    }
  }

  // Max entropy for N outcomes: log2(N)
  const maxH = Math.log2(brackets.length);
  if (maxH === 0) return 100;

  // Invert normalized entropy → confidence
  const normalizedH = H / maxH; // 0 = all probability in one bracket, 1 = uniform
  return Math.round((1 - normalizedH) * 100);
}

/**
 * Generate a plain-English market summary.
 */
export function generateMarketSummary(
  symbol: string,
  brackets: PriceBracket[],
  spotPrice?: number | null,
): string {
  if (brackets.length === 0) return `No forecast data available for ${symbol}.`;

  const total = brackets.reduce((s, b) => s + b.probability, 0);
  if (total === 0) return `No forecast data available for ${symbol}.`;

  // Find the most likely bracket
  const best = brackets.reduce((a, b) => (b.probability > a.probability ? b : a));
  const bestPct = Math.round((best.probability / total) * 100);

  let summary = `${bestPct}% chance ${symbol} ends between ${best.displayRange}`;

  // Add range summary (50% central range)
  const bands = computeProbabilityBands(brackets);
  if (bands.range50) {
    summary += `. The 50% range is ${formatPrice(bands.range50.low)} - ${formatPrice(bands.range50.high)}`;
  }

  if (spotPrice != null) {
    const delta = computeSpotDelta(spotPrice, brackets);
    if (delta) {
      const dir = delta.delta > 0 ? 'above' : 'below';
      summary += `. Spot is ${Math.abs(delta.deltaPercent).toFixed(1)}% ${dir} expected`;
    }
  }

  return summary + '.';
}

/**
 * Compute 50% and 80% central probability ranges.
 * Walk CDF from edges inward.
 */
export function computeProbabilityBands(brackets: PriceBracket[]): {
  range50: { low: number; high: number } | null;
  range80: { low: number; high: number } | null;
} {
  if (brackets.length === 0) return { range50: null, range80: null };

  const total = brackets.reduce((s, b) => s + b.probability, 0);
  if (total === 0) return { range50: null, range80: null };

  // Sort by floor strike ascending
  const sorted = [...brackets]
    .filter((b) => b.floorStrike != null || b.capStrike != null)
    .sort((a, b) => (a.floorStrike ?? -Infinity) - (b.floorStrike ?? -Infinity));

  if (sorted.length === 0) return { range50: null, range80: null };

  function findRange(targetCoverage: number): { low: number; high: number } | null {
    const tailAllowance = (1 - targetCoverage) / 2; // cut from each side
    const cutoff = tailAllowance * total;

    let cumLow = 0;
    let lowIdx = 0;
    for (let i = 0; i < sorted.length; i++) {
      cumLow += sorted[i].probability;
      if (cumLow >= cutoff) {
        lowIdx = i;
        break;
      }
    }

    let cumHigh = 0;
    let highIdx = sorted.length - 1;
    for (let i = sorted.length - 1; i >= 0; i--) {
      cumHigh += sorted[i].probability;
      if (cumHigh >= cutoff) {
        highIdx = i;
        break;
      }
    }

    const low = sorted[lowIdx].floorStrike ?? sorted[lowIdx].capStrike ?? 0;
    const high = sorted[highIdx].capStrike ?? sorted[highIdx].floorStrike ?? 0;

    if (high <= low) return null;
    return { low, high };
  }

  return {
    range50: findRange(0.5),
    range80: findRange(0.8),
  };
}

/**
 * Compute how spot price differs from expected forecast value.
 */
export function computeSpotDelta(
  spot: number,
  brackets: PriceBracket[],
): { delta: number; deltaPercent: number; direction: 'above' | 'below' | 'at' } | null {
  const total = brackets.reduce((s, b) => s + b.probability, 0);
  if (total === 0 || spot === 0) return null;

  // Calculate expected value
  let weightedSum = 0;
  for (const b of brackets) {
    const mid =
      b.floorStrike != null && b.capStrike != null
        ? (b.floorStrike + b.capStrike) / 2
        : b.floorStrike != null
          ? b.floorStrike * 1.1
          : b.capStrike != null
            ? b.capStrike * 0.9
            : 0;
    weightedSum += mid * (b.probability / 100);
  }
  const expected = weightedSum / (total / 100);
  if (expected === 0) return null;

  const delta = spot - expected;
  const deltaPercent = (delta / expected) * 100;
  const direction = delta > 0.001 ? 'above' : delta < -0.001 ? 'below' : 'at';

  return { delta, deltaPercent, direction };
}

/**
 * Compute trend vs a week ago from forecast history.
 */
export function computeTrend(
  history: ForecastPoint[],
): { direction: 'up' | 'down' | 'flat'; changePercent: number } | null {
  if (history.length < 2) return null;

  const current = history[history.length - 1].forecast;
  // Find point ~7 days ago
  const now = history[history.length - 1].timestamp;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  let closest = history[0];
  let closestDiff = Math.abs(history[0].timestamp - weekAgo);
  for (const p of history) {
    const diff = Math.abs(p.timestamp - weekAgo);
    if (diff < closestDiff) {
      closest = p;
      closestDiff = diff;
    }
  }

  if (closest.forecast === 0) return null;
  const changePercent = ((current - closest.forecast) / closest.forecast) * 100;

  const direction =
    changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'flat';

  return { direction, changePercent };
}
