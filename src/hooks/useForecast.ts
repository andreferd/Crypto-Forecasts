import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { CRYPTO_TICKERS } from '../constants/kalshi';
import { fetchMarketsBySeries } from '../services/kalshiApi';
import { buildForecastSeries } from '../services/kalshiParser';
import { CryptoForecast, ForecastSeries } from '../types/market';
import { KalshiMarket } from '../types/kalshi';

export function useForecast(symbol: string): CryptoForecast {
  const tickers = CRYPTO_TICKERS[symbol] ?? [];

  // useQueries keeps the hook count constant across symbol changes —
  // tickers.length differs by symbol (SOL has 2, BTC/ETH have 3), so calling
  // useQuery in a loop would violate Rules of Hooks and crash on switch.
  const queries = useQueries({
    queries: tickers.map((t) => ({
      queryKey: ['kalshi-markets', t.seriesTicker],
      queryFn: () => fetchMarketsBySeries(t.seriesTicker),
      staleTime: 60_000,
      refetchInterval: 120_000,
      retry: 2,
    })),
  });

  const dataKey = queries.map((q) => q.dataUpdatedAt).join('|');

  const forecasts = useMemo<ForecastSeries[]>(() => {
    return tickers
      .map((t, i) => {
        const data = queries[i]?.data as KalshiMarket[] | undefined;
        if (!data || data.length === 0) return null;
        return buildForecastSeries(t.type, t.label, t.seriesTicker, data);
      })
      .filter((f): f is ForecastSeries => f != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, dataKey]);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  return { symbol, forecasts, isLoading, isError };
}
