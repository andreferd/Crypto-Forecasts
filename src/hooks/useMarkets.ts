import { useQuery } from '@tanstack/react-query';
import { fetchMarketsBySeries } from '../services/kalshiApi';
import { KalshiMarket } from '../types/kalshi';

export function useMarkets(seriesTicker: string, enabled = true) {
  return useQuery<KalshiMarket[]>({
    queryKey: ['kalshi-markets', seriesTicker],
    queryFn: () => fetchMarketsBySeries(seriesTicker),
    enabled,
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // 2 minutes auto-refresh
    retry: 2,
  });
}
