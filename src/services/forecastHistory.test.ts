const mockGet = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: mockGet })),
  },
}));

jest.mock('./kalshiApi', () => ({
  fetchMarketsBySeries: jest.fn(),
}));

import { fetchForecastHistory } from './forecastHistory';
import { fetchMarketsBySeries } from './kalshiApi';
import { KalshiMarket } from '../types/kalshi';

const mockedFetchMarkets = fetchMarketsBySeries as jest.MockedFunction<
  typeof fetchMarketsBySeries
>;

function market(partial: Partial<KalshiMarket>): KalshiMarket {
  return {
    ticker: 'T',
    event_ticker: 'E',
    title: 't',
    status: 'open',
    strike_type: 'between',
    yes_bid_dollars: '0',
    yes_ask_dollars: '0',
    no_bid_dollars: '0',
    no_ask_dollars: '0',
    last_price_dollars: '0',
    no_sub_title: '',
    volume_fp: '0',
    open_interest_fp: '0',
    result: '',
    ...partial,
  };
}

beforeEach(() => {
  mockGet.mockReset();
  mockedFetchMarkets.mockReset();
  // Freeze "now" so the daysBack cutoff is deterministic, but keep real setTimeout
  // so the batch-throttle await resolves (not hit with small inputs).
  jest.useFakeTimers({
    doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask'],
  });
  jest.setSystemTime(new Date('2026-03-10T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('fetchForecastHistory', () => {
  it('returns empty array when there are no markets for the series', async () => {
    mockedFetchMarkets.mockResolvedValue([]);
    const out = await fetchForecastHistory('KXBTCY');
    expect(out).toEqual([]);
    // No trade requests should be issued
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('computes daily expected values from trades and market midpoints', async () => {
    mockedFetchMarkets.mockResolvedValue([
      market({
        ticker: 'A',
        floor_strike: 100,
        cap_strike: 200,
        yes_bid_dollars: '0',
        last_price_dollars: '0',
      }),
      market({
        ticker: 'B',
        floor_strike: 200,
        cap_strike: 300,
        yes_bid_dollars: '0',
        last_price_dollars: '0',
      }),
    ]);

    // Dynamic response based on the ticker in the request params
    mockGet.mockImplementation(async (_url: string, opts: { params: { ticker: string } }) => {
      const ticker = opts.params.ticker;
      if (ticker === 'A') {
        return {
          data: {
            trades: [
              // newest first
              { ticker: 'A', created_time: '2026-03-04T10:00:00Z', yes_price_dollars: '0.60' },
              { ticker: 'A', created_time: '2026-03-03T10:00:00Z', yes_price_dollars: '0.55' },
            ],
            cursor: '',
          },
        };
      }
      if (ticker === 'B') {
        return {
          data: {
            trades: [
              { ticker: 'B', created_time: '2026-03-04T11:00:00Z', yes_price_dollars: '0.25' },
              { ticker: 'B', created_time: '2026-03-03T11:00:00Z', yes_price_dollars: '0.28' },
            ],
            cursor: '',
          },
        };
      }
      throw new Error(`unexpected ticker ${ticker}`);
    });

    const points = await fetchForecastHistory('KXBTCY');

    // Two days of data, sorted ascending
    expect(points).toHaveLength(2);
    expect(points[0].timestamp).toBe(Date.parse('2026-03-03T12:00:00Z'));
    expect(points[1].timestamp).toBe(Date.parse('2026-03-04T12:00:00Z'));

    // Day 03: mid*price weighted / total price → 150*55 + 250*28 = 15250; /83 = 183.73 → 184
    expect(points[0].forecast).toBe(184);
    // Day 04: 150*60 + 250*25 = 15250; /85 = 179.41 → 179
    expect(points[1].forecast).toBe(179);
  });

  it('skips trades older than the daysBack cutoff', async () => {
    mockedFetchMarkets.mockResolvedValue([
      market({ ticker: 'A', floor_strike: 100, cap_strike: 200 }),
    ]);

    mockGet.mockImplementation(async () => ({
      data: {
        trades: [
          { ticker: 'A', created_time: '2026-03-05T10:00:00Z', yes_price_dollars: '0.50' },
          // Way past the 30-day window from 2026-03-10
          { ticker: 'A', created_time: '2020-01-01T10:00:00Z', yes_price_dollars: '0.99' },
        ],
        cursor: '',
      },
    }));

    const points = await fetchForecastHistory('KXBTCY', 30);
    // Only the in-range trade produces a forecast point
    expect(points).toHaveLength(1);
    expect(points[0].timestamp).toBe(Date.parse('2026-03-05T12:00:00Z'));
  });

  it('swallows trade-fetch errors and still returns whatever could be computed', async () => {
    mockedFetchMarkets.mockResolvedValue([
      market({ ticker: 'A', floor_strike: 100, cap_strike: 200 }),
    ]);
    mockGet.mockRejectedValue(new Error('boom'));

    const points = await fetchForecastHistory('KXBTCY');
    // No trades, no forecast points
    expect(points).toEqual([]);
  });
});
