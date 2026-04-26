import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 10000,
});

export interface SpotPrices {
  BTC: number | null;
  ETH: number | null;
  SOL: number | null;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
};

export async function fetchSpotPrices(): Promise<SpotPrices> {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const { data } = await client.get('/simple/price', {
      params: { ids, vs_currencies: 'usd' },
    });

    return {
      BTC: data.bitcoin?.usd ?? null,
      ETH: data.ethereum?.usd ?? null,
      SOL: data.solana?.usd ?? null,
    };
  } catch {
    return { BTC: null, ETH: null, SOL: null };
  }
}

export interface SpotHistoryPoint {
  timestamp: number;
  price: number;
}

/**
 * Daily spot prices for the past `days` days. Free tier: hourly granularity
 * for 1-90 days, daily otherwise. Returns empty on error.
 */
export async function fetchSpotHistory(
  symbol: string,
  days = 30,
): Promise<SpotHistoryPoint[]> {
  const id = COINGECKO_IDS[symbol];
  if (!id) return [];
  try {
    const { data } = await client.get(`/coins/${id}/market_chart`, {
      params: { vs_currency: 'usd', days, interval: 'daily' },
    });
    const prices: [number, number][] = data.prices ?? [];
    return prices.map(([ts, price]) => ({ timestamp: ts, price }));
  } catch {
    return [];
  }
}
