import { useForecastHistory } from './useForecastHistory';
import { ALL_CRYPTO_KEYS, CRYPTO_TICKERS } from '../constants/kalshi';
import { ForecastPoint } from '../services/forecastHistory';

export type ForecastHistoriesBySymbol = Record<string, ForecastPoint[] | undefined>;

/**
 * Aggregate hook returning EOY forecast history per symbol.
 *
 * ALL_CRYPTO_KEYS is module-level — fixed length, hooks-rules-safe.
 */
export function useAllForecastHistories(daysBack = 30): {
  histories: ForecastHistoriesBySymbol;
  dataUpdatedAt: number;
} {
  const histories: ForecastHistoriesBySymbol = {};
  let latestUpdatedAt = 0;
  for (const sym of ALL_CRYPTO_KEYS) {
    const eoyTicker = CRYPTO_TICKERS[sym]?.find((t) => t.type === 'eoy')?.seriesTicker;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useForecastHistory(eoyTicker, daysBack);
    histories[sym] = q.data;
    if (q.dataUpdatedAt > latestUpdatedAt) latestUpdatedAt = q.dataUpdatedAt;
  }
  return { histories, dataUpdatedAt: latestUpdatedAt };
}
