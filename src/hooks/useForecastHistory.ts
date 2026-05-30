import { useQuery } from '@tanstack/react-query';
import { fetchForecastHistory, ForecastPoint } from '../services/forecastHistory';

export function useForecastHistory(seriesTicker: string | undefined, daysBack = 30) {
  return useQuery<ForecastPoint[]>({
    queryKey: ['forecast-history', seriesTicker, daysBack],
    queryFn: () => fetchForecastHistory(seriesTicker!, daysBack),
    enabled: !!seriesTicker,
    staleTime: 5 * 60_000, // 5 min cache
    // Daily-granularity history barely changes intraday and the fetch is
    // heavy — refresh every 30 min instead of 10.
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}
