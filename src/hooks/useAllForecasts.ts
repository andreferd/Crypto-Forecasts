import { useForecast } from './useForecast';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';
import { CryptoForecast } from '../types/market';

export type ForecastsBySymbol = Record<string, CryptoForecast>;

/**
 * Aggregate hook that returns every crypto's forecast in one record.
 *
 * ALL_CRYPTO_KEYS is a module-level constant — its length never changes
 * at runtime, so calling useForecast in a fixed-length loop is
 * Rules-of-Hooks safe. React Query's structural sharing keeps each
 * inner forecasts array stable across renders, so consumers can safely
 * include the returned record (or its inner arrays) in dependency lists.
 */
export function useAllForecasts(): ForecastsBySymbol {
  const result: ForecastsBySymbol = {};
  for (const sym of ALL_CRYPTO_KEYS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    result[sym] = useForecast(sym);
  }
  return result;
}
