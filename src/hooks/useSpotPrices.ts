import { useQuery } from '@tanstack/react-query';
import { fetchSpotPrices, SpotPrices } from '../services/coinGeckoApi';

export function useSpotPrices() {
  return useQuery<SpotPrices>({
    queryKey: ['spot-prices'],
    queryFn: fetchSpotPrices,
    staleTime: 60_000, // 60s stale time
    refetchInterval: 60_000,
    retry: 2,
  });
}
