import { useMemo } from 'react';
import { CRYPTO_TICKERS } from '../constants/kalshi';
import { useMarkets } from './useMarkets';
import { buildForecastSeries } from '../services/kalshiParser';
import { CryptoForecast, ForecastSeries } from '../types/market';

export function useForecast(symbol: string): CryptoForecast {
  const tickers = CRYPTO_TICKERS[symbol] ?? [];

  // Create a query for each series ticker
  const queries = tickers.map((t) => useMarkets(t.seriesTicker));

  const forecasts = useMemo<ForecastSeries[]>(() => {
    return tickers
      .map((t, i) => {
        const data = queries[i]?.data;
        if (!data || data.length === 0) return null;
        return buildForecastSeries(t.type, t.label, t.seriesTicker, data);
      })
      .filter((f): f is ForecastSeries => f != null);
  }, [tickers, ...queries.map((q) => q.data)]);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  return { symbol, forecasts, isLoading, isError };
}
