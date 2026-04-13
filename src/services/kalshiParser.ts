import { KalshiMarket } from '../types/kalshi';
import { PriceBracket, ForecastSeries } from '../types/market';
import { ForecastType } from '../constants/kalshi';

function formatPrice(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function buildDisplayRange(
  strikeType: string,
  floor: number | undefined,
  cap: number | undefined,
): string {
  if (strikeType === 'between' && floor != null && cap != null) {
    return `${formatPrice(floor)} - ${formatPrice(cap)}`;
  }
  if (strikeType === 'greater' && floor != null) {
    return `${formatPrice(floor)}+`;
  }
  if (strikeType === 'less' && cap != null) {
    return `< ${formatPrice(cap)}`;
  }
  // Fallback
  if (floor != null && cap != null) {
    return `${formatPrice(floor)} - ${formatPrice(cap)}`;
  }
  if (floor != null) return `${formatPrice(floor)}+`;
  if (cap != null) return `< ${formatPrice(cap)}`;
  return 'Unknown';
}

function dollarsToProbability(dollars: string): number {
  // dollars is like "0.0190" meaning $0.019 = 1.9%
  const value = parseFloat(dollars);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function parseMarketsToBrackets(markets: KalshiMarket[]): PriceBracket[] {
  const brackets: PriceBracket[] = markets
    .map((m) => {
      const probability =
        dollarsToProbability(m.yes_bid_dollars) ||
        dollarsToProbability(m.last_price_dollars);

      return {
        ticker: m.ticker,
        label: m.no_sub_title || m.title,
        floorStrike: m.floor_strike ?? null,
        capStrike: m.cap_strike ?? null,
        probability,
        displayRange: buildDisplayRange(
          m.strike_type,
          m.floor_strike,
          m.cap_strike,
        ),
        volume: parseFloat(m.volume_fp) || 0,
        openInterest: parseFloat(m.open_interest_fp) || 0,
      };
    })
    .filter((b) => b.probability > 0);

  // Sort by floor strike ascending (null floor = lowest, meaning "less than" bracket)
  brackets.sort((a, b) => {
    const aFloor = a.floorStrike ?? -Infinity;
    const bFloor = b.floorStrike ?? -Infinity;
    return aFloor - bFloor;
  });

  return brackets;
}

export function buildForecastSeries(
  type: ForecastType,
  label: string,
  seriesTicker: string,
  markets: KalshiMarket[],
): ForecastSeries {
  const brackets = parseMarketsToBrackets(markets);

  const mostLikelyBracket =
    brackets.length > 0
      ? brackets.reduce((best, b) =>
          b.probability > best.probability ? b : best,
        )
      : null;

  // Calculate expected value as probability-weighted midpoint
  let expectedValue: number | null = null;
  const totalProb = brackets.reduce((s, b) => s + b.probability, 0);
  if (
    totalProb > 0 &&
    brackets.some((b) => b.floorStrike != null || b.capStrike != null)
  ) {
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
    expectedValue = Math.round(weightedSum / (totalProb / 100));
  }

  return {
    type,
    label,
    seriesTicker,
    brackets,
    mostLikelyBracket,
    expectedValue,
  };
}
