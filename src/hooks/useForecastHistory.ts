import { useQuery } from '@tanstack/react-query';
import { fetchForecastHistory, ForecastPoint } from '../services/forecastHistory';

export function useForecastHistory(seriesTicker: string | undefined, daysBack = 30) {
  return useQuery<ForecastPoint[]>({
    queryKey: ['forecast-history', seriesTicker, daysBack],
    queryFn: () => fetchForecastHistory(seriesTicker!, daysBack),
    enabled: !!seriesTicker,
    staleTime: 5 * 60_000, // 5 min cache
    refetchInterval: 10 * 60_000, // 10 min refresh (heavy call)
    retry: 1,
  });
}
