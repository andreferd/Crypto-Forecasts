const mockGet = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: mockGet })),
  },
}));

import { fetchSpotPrices, COINGECKO_IDS } from './coinGeckoApi';

beforeEach(() => {
  mockGet.mockReset();
});

const ALL_SYMBOLS = Object.keys(COINGECKO_IDS);
function nullsForAll() {
  return Object.fromEntries(ALL_SYMBOLS.map((s) => [s, null]));
}

describe('fetchSpotPrices', () => {
  it('maps coingecko response to symbol prices', async () => {
    mockGet.mockResolvedValue({
      data: {
        bitcoin: { usd: 50_000 },
        ethereum: { usd: 3000 },
        solana: { usd: 150 },
      },
    });
    expect(await fetchSpotPrices()).toEqual({
      ...nullsForAll(),
      BTC: 50_000,
      ETH: 3000,
      SOL: 150,
    });
  });

  it('returns null for symbols missing from the response', async () => {
    mockGet.mockResolvedValue({
      data: {
        bitcoin: { usd: 50_000 },
      },
    });
    const result = await fetchSpotPrices();
    expect(result.BTC).toBe(50_000);
    expect(result.ETH).toBeNull();
    expect(result.SOL).toBeNull();
  });

  it('returns all nulls when the request throws', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    expect(await fetchSpotPrices()).toEqual(nullsForAll());
  });

  it('calls the simple/price endpoint with comma-joined ids and usd vs_currency', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await fetchSpotPrices();
    const expectedIds = Object.values(COINGECKO_IDS).join(',');
    expect(mockGet).toHaveBeenCalledWith('/simple/price', {
      params: { ids: expectedIds, vs_currencies: 'usd' },
    });
  });
});
