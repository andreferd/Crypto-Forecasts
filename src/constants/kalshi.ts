export const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

export type ForecastType = 'eoy' | 'max' | 'min';

export interface TickerMapping {
  seriesTicker: string;
  label: string;
  type: ForecastType;
}

export const CRYPTO_TICKERS: Record<string, TickerMapping[]> = {
  BTC: [
    { seriesTicker: 'KXBTCY', label: 'End of Year', type: 'eoy' },
    { seriesTicker: 'KXBTCMAXY', label: 'Yearly High', type: 'max' },
    { seriesTicker: 'KXBTCMINY', label: 'Yearly Low', type: 'min' },
  ],
  ETH: [
    { seriesTicker: 'KXETHY', label: 'End of Year', type: 'eoy' },
    { seriesTicker: 'KXETHMAXY', label: 'Yearly High', type: 'max' },
    { seriesTicker: 'KXETHMINY', label: 'Yearly Low', type: 'min' },
  ],
  SOL: [
    { seriesTicker: 'KXSOLD26', label: 'End of Year', type: 'eoy' },
    { seriesTicker: 'KXSOLMAXY', label: 'Yearly High', type: 'max' },
  ],
};

export const ALL_CRYPTO_KEYS = Object.keys(CRYPTO_TICKERS) as Array<
  keyof typeof CRYPTO_TICKERS
>;
