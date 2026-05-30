import { useQuery } from '@tanstack/react-query';
import { fetchSpotPrices, SpotPrices } from '../services/coinGeckoApi';

export function useSpotPrices() {
  return useQuery<SpotPrices>({
    queryKey: ['spot-prices'],
    queryFn: fetchSpotPrices,
    staleTime: 60_000, // 60s stale time
    // The "now" price is context for a year-end forecast, not a trading
    // ticker — 2 min is plenty and eases CoinGecko's free-tier rate limit.
    refetchInterval: 120_000,
    retry: 2,
  });
}
