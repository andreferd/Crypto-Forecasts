import axios from 'axios';
import { KALSHI_API_BASE } from '../constants/kalshi';
import { KalshiMarket } from '../types/kalshi';
import { fetchMarketsBySeries } from './kalshiApi';

const client = axios.create({
  baseURL: KALSHI_API_BASE,
  timeout: 15000,
});

interface Trade {
  ticker: string;
  created_time: string;
  yes_price_dollars: string;
}

interface TradesResponse {
  trades: Trade[];
  cursor: string;
}

export interface ForecastPoint {
  timestamp: number;
  forecast: number;
}

async function fetchTradesForTicker(
  ticker: string,
  daysBack: number,
): Promise<Trade[]> {
  const allTrades: Trade[] = [];
  let cursor: string | undefined;
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - daysBack);
  const minTime = minDate.toISOString();

  // Paginate to get trades going back daysBack days (max 5 pages per bracket)
  for (let page = 0; page < 5; page++) {
    const params: Record<string, string> = {
      ticker,
      limit: '500',
    };
    if (cursor) params.cursor = cursor;

    try {
      const { data } = await client.get<TradesResponse>('/markets/trades', {
        params,
      });
      if (!data.trades || data.trades.length === 0) break;

      for (const t of data.trades) {
        if (t.created_time < minTime) {
          // We've gone past our date range
          return allTrades;
        }
        allTrades.push(t);
      }

      if (!data.cursor) break;
      cursor = data.cursor;
    } catch {
      break;
    }
  }

  return allTrades;
}

function computeDailyForecast(
  allTrades: Trade[],
  markets: KalshiMarket[],
): ForecastPoint[] {
  // Build market metadata: ticker -> { floor, cap, midpoint }
  const marketMeta = new Map<
    string,
    { floor: number; cap: number; mid: number }
  >();
  for (const m of markets) {
    const floor = m.floor_strike;
    const cap = m.cap_strike;
    let mid: number;
    if (floor != null && cap != null) {
      mid = (floor + cap) / 2;
    } else if (floor != null) {
      mid = floor * 1.1;
    } else if (cap != null) {
      mid = cap * 0.9;
    } else {
      continue;
    }
    marketMeta.set(m.ticker, { floor: floor ?? 0, cap: cap ?? 0, mid });
  }

  // Group trades by day
  const tradesByDay = new Map<string, Map<string, number>>();
  for (const t of allTrades) {
    const day = t.created_time.slice(0, 10); // YYYY-MM-DD
    if (!tradesByDay.has(day)) {
      tradesByDay.set(day, new Map());
    }
    const dayMap = tradesByDay.get(day)!;
    // Keep latest trade price per ticker per day (trades come newest first)
    if (!dayMap.has(t.ticker)) {
      dayMap.set(t.ticker, parseFloat(t.yes_price_dollars));
    }
  }

  // For each day, compute expected value
  const dailyForecasts: ForecastPoint[] = [];
  const sortedDays = [...tradesByDay.keys()].sort();

  // Maintain a running "last known price" per ticker
  const lastKnownPrice = new Map<string, number>();

  // Initialize with current market prices
  for (const m of markets) {
    const price = parseFloat(m.yes_bid_dollars) || parseFloat(m.last_price_dollars);
    if (price > 0) lastKnownPrice.set(m.ticker, price);
  }

  for (const day of sortedDays) {
    const dayPrices = tradesByDay.get(day)!;

    // Update last known prices with today's trades
    for (const [ticker, price] of dayPrices) {
      lastKnownPrice.set(ticker, price);
    }

    // Compute expected value from all known prices
    let weightedSum = 0;
    let totalProb = 0;
    for (const [ticker, price] of lastKnownPrice) {
      const meta = marketMeta.get(ticker);
      if (!meta) continue;
      const prob = price * 100; // Convert dollars to percentage
      weightedSum += meta.mid * prob;
      totalProb += prob;
    }

    if (totalProb > 0) {
      const forecast = Math.round(weightedSum / totalProb);
      const ts = new Date(day + 'T12:00:00Z').getTime();
      dailyForecasts.push({ timestamp: ts, forecast });
    }
  }

  return dailyForecasts;
}

export async function fetchForecastHistory(
  seriesTicker: string,
  daysBack = 30,
): Promise<ForecastPoint[]> {
  // 1. Get all bracket markets
  const markets = await fetchMarketsBySeries(seriesTicker);
  if (markets.length === 0) return [];

  // 2. Fetch trades for each bracket in parallel (batches of 5 to avoid rate limits)
  const allTrades: Trade[] = [];
  const tickers = markets.map((m) => m.ticker);

  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    const results = await Promise.all(
      batch.map((ticker) => fetchTradesForTicker(ticker, daysBack)),
    );
    for (const trades of results) {
      allTrades.push(...trades);
    }
    // Small delay between batches to be polite
    if (i + 5 < tickers.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 3. Compute daily forecast values
  return computeDailyForecast(allTrades, markets);
}
