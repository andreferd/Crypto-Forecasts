import { ForecastType } from '../constants/kalshi';

export interface PriceBracket {
  ticker: string;
  label: string;
  floorStrike: number | null;
  capStrike: number | null;
  probability: number; // 0-100
  displayRange: string;
  volume: number;
  openInterest: number;
}

export interface ForecastSeries {
  type: ForecastType;
  label: string;
  seriesTicker: string;
  brackets: PriceBracket[];
  mostLikelyBracket: PriceBracket | null;
  expectedValue: number | null;
}

export interface CryptoForecast {
  symbol: string;
  forecasts: ForecastSeries[];
  isLoading: boolean;
  isError: boolean;
}
