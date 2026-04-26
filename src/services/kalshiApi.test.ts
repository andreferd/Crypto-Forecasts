const mockGet = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: mockGet })),
  },
}));

import { fetchMarketsBySeries } from './kalshiApi';
import { KalshiMarket } from '../types/kalshi';

function market(ticker: string): KalshiMarket {
  return {
    ticker,
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
  };
}

beforeEach(() => {
  mockGet.mockReset();
});

describe('fetchMarketsBySeries', () => {
  it('returns markets from a single page when cursor is empty', async () => {
    mockGet.mockResolvedValueOnce({
      data: { markets: [market('A'), market('B')], cursor: '' },
    });

    const result = await fetchMarketsBySeries('KXBTCY');
    expect(result.map((m) => m.ticker)).toEqual(['A', 'B']);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('paginates across multiple pages using the cursor', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { markets: [market('A')], cursor: 'c1' } })
      .mockResolvedValueOnce({ data: { markets: [market('B')], cursor: 'c2' } })
      .mockResolvedValueOnce({ data: { markets: [market('C')], cursor: '' } });

    const result = await fetchMarketsBySeries('KXBTCY');
    expect(result.map((m) => m.ticker)).toEqual(['A', 'B', 'C']);
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it('stops when a page returns zero markets', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { markets: [market('A')], cursor: 'c1' } })
      .mockResolvedValueOnce({ data: { markets: [], cursor: 'c2' } });

    const result = await fetchMarketsBySeries('KXBTCY');
    expect(result.map((m) => m.ticker)).toEqual(['A']);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('sends the series_ticker, status=open, limit=200 on first page (no cursor)', async () => {
    mockGet.mockResolvedValueOnce({ data: { markets: [], cursor: '' } });
    await fetchMarketsBySeries('KXBTCY');
    expect(mockGet).toHaveBeenCalledWith('/markets', {
      params: { series_ticker: 'KXBTCY', status: 'open', limit: '200' },
    });
  });

  it('includes cursor in params on subsequent pages', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { markets: [market('A')], cursor: 'cursor-2' } })
      .mockResolvedValueOnce({ data: { markets: [market('B')], cursor: '' } });

    await fetchMarketsBySeries('KXBTCY');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/markets', {
      params: { series_ticker: 'KXBTCY', status: 'open', limit: '200', cursor: 'cursor-2' },
    });
  });

  it('caps pagination at 10 pages', async () => {
    mockGet.mockResolvedValue({
      data: { markets: [market('X')], cursor: 'always-more' },
    });
    const result = await fetchMarketsBySeries('KXBTCY');
    expect(result).toHaveLength(10);
    expect(mockGet).toHaveBeenCalledTimes(10);
  });
});
