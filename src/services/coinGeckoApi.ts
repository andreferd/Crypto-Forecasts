import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 10000,
});

export type SpotPrices = Record<string, number | null>;

export const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  DOT: 'polkadot',
  BNB: 'binancecoin',
};

const CG_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_IDS).map(([sym, id]) => [id, sym]),
);

export async function fetchSpotPrices(): Promise<SpotPrices> {
  const result: SpotPrices = Object.fromEntries(
    Object.keys(COINGECKO_IDS).map((sym) => [sym, null]),
  );
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const { data } = await client.get('/simple/price', {
      params: { ids, vs_currencies: 'usd' },
    });
    for (const [id, payload] of Object.entries(data ?? {})) {
      const sym = CG_TO_SYMBOL[id];
      if (sym) result[sym] = (payload as { usd?: number })?.usd ?? null;
    }
    return result;
  } catch {
    return result;
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
