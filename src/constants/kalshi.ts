export const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/**
 * Forecast types we surface.
 *  - 'eoy'    — full price-range bracket series resolving end-of-year (only BTC/ETH/SOL today).
 *  - 'max'    — yearly maximum-price bracket series.
 *  - 'min'    — yearly minimum-price bracket series.
 *  - 'maxmon' — current-month maximum-price bracket series.
 *  - 'minmon' — current-month minimum-price bracket series.
 */
export type ForecastType = 'eoy' | 'max' | 'min' | 'maxmon' | 'minmon';

export interface TickerMapping {
  seriesTicker: string;
  label: string;
  type: ForecastType;
}

/**
 * Per-symbol Kalshi series tickers. Coverage varies by token: only BTC/ETH/SOL
 * have a price-range EOY series ('eoy'). Newer tokens currently only have
 * monthly max/min ('maxmon' / 'minmon').
 *
 * Predict-screen flows that need an explicit price-target probability bracket
 * only operate on tokens that include 'eoy' (see EOY_SYMBOLS below).
 */
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
  XRP: [
    { seriesTicker: 'KXXRPMAXMON', label: 'Monthly High', type: 'maxmon' },
    { seriesTicker: 'KXXRPMINMON', label: 'Monthly Low', type: 'minmon' },
  ],
  DOGE: [
    { seriesTicker: 'KXDOGEMAXMON', label: 'Monthly High', type: 'maxmon' },
    { seriesTicker: 'KXDOGEMINMON', label: 'Monthly Low', type: 'minmon' },
  ],
  BNB: [
    { seriesTicker: 'KXBNBMAXMON', label: 'Monthly High', type: 'maxmon' },
    { seriesTicker: 'KXBNBMINMON', label: 'Monthly Low', type: 'minmon' },
  ],
};

export const ALL_CRYPTO_KEYS = Object.keys(CRYPTO_TICKERS) as Array<
  keyof typeof CRYPTO_TICKERS
>;

/** Subset of symbols that have the 'eoy' price-range series — used by the Predict screen. */
export const EOY_SYMBOLS = ALL_CRYPTO_KEYS.filter((sym) =>
  CRYPTO_TICKERS[sym].some((t) => t.type === 'eoy'),
);
