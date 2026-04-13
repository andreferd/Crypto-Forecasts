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
