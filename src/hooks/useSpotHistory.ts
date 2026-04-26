import { useQuery } from '@tanstack/react-query';
import { fetchSpotHistory, SpotHistoryPoint } from '../services/coinGeckoApi';

export function useSpotHistory(symbol: string, days = 30) {
  return useQuery<SpotHistoryPoint[]>({
    queryKey: ['spot-history', symbol, days],
    queryFn: () => fetchSpotHistory(symbol, days),
    staleTime: 30 * 60_000, // 30 min — daily granularity is fine
    retry: 2,
    enabled: !!symbol,
  });
}
