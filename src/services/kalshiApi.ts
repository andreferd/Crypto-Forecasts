import axios from 'axios';
import { KALSHI_API_BASE } from '../constants/kalshi';
import {
  KalshiMarket,
  KalshiMarketsResponse,
} from '../types/kalshi';

const client = axios.create({
  baseURL: KALSHI_API_BASE,
  timeout: 15000,
});

export async function fetchMarketsBySeries(
  seriesTicker: string,
): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = [];
  let cursor: string | undefined;

  // Paginate through all markets in the series
  for (let i = 0; i < 10; i++) {
    const params: Record<string, string> = {
      series_ticker: seriesTicker,
      status: 'open',
      limit: '200',
    };
    if (cursor) {
      params.cursor = cursor;
    }

    const { data } = await client.get<KalshiMarketsResponse>('/markets', {
      params,
    });

    allMarkets.push(...data.markets);

    if (!data.cursor || data.markets.length === 0) {
      break;
    }
    cursor = data.cursor;
  }

  return allMarkets;
}
