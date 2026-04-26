const mockGet = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: mockGet })),
  },
}));

import { fetchSpotPrices } from './coinGeckoApi';

beforeEach(() => {
  mockGet.mockReset();
});

describe('fetchSpotPrices', () => {
  it('maps coingecko response to symbol prices', async () => {
    mockGet.mockResolvedValue({
      data: {
        bitcoin: { usd: 50_000 },
        ethereum: { usd: 3000 },
        solana: { usd: 150 },
      },
    });
    expect(await fetchSpotPrices()).toEqual({ BTC: 50_000, ETH: 3000, SOL: 150 });
  });

  it('returns null for symbols missing from the response', async () => {
    mockGet.mockResolvedValue({
      data: {
        bitcoin: { usd: 50_000 },
      },
    });
    expect(await fetchSpotPrices()).toEqual({ BTC: 50_000, ETH: null, SOL: null });
  });

  it('returns all nulls when the request throws', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    expect(await fetchSpotPrices()).toEqual({ BTC: null, ETH: null, SOL: null });
  });

  it('calls the simple/price endpoint with comma-joined ids and usd vs_currency', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await fetchSpotPrices();
    expect(mockGet).toHaveBeenCalledWith('/simple/price', {
      params: { ids: 'bitcoin,ethereum,solana', vs_currencies: 'usd' },
    });
  });
});
