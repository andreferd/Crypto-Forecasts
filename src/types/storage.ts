import { PriceBracket } from './market';

// ─── Digest ───────────────────────────────────────────────

export interface BracketSnapshot {
  ticker: string;
  displayRange: string;
  probability: number;
  floorStrike: number | null;
  capStrike: number | null;
}

export interface SymbolSnapshot {
  symbol: string;
  expectedValue: number | null;
  brackets: BracketSnapshot[];
  timestamp: number;
}

export interface DigestSnapshot {
  symbols: SymbolSnapshot[];
  timestamp: number;
}

export interface BracketDiff {
  displayRange: string;
  oldProb: number;
  newProb: number;
  delta: number; // newProb - oldProb
}

export interface SymbolDigest {
  symbol: string;
  oldExpectedValue: number | null;
  newExpectedValue: number | null;
  expectedValueDelta: number | null;
  bracketDiffs: BracketDiff[];
  biggestMover: BracketDiff | null;
}

// ─── Alerts ───────────────────────────────────────────────

export interface AlertBaselines {
  symbols: Record<string, BracketSnapshot[]>;
  timestamp: number;
}

export interface AlertSettings {
  enabled: boolean;
  thresholdPercent: number; // default 5
}

// ─── Accuracy ─────────────────────────────────────────────

export interface DailyAccuracyEntry {
  date: string; // YYYY-MM-DD
  symbol: string;
  expectedValue: number;
  spotPrice: number;
  timestamp: number;
}

export interface AccuracyLog {
  entries: DailyAccuracyEntry[];
}

export interface AccuracyMetrics {
  symbol: string;
  meanAbsoluteError: number;
  meanPercentError: number;
  brierLikeScore: number;
  daysTracked: number;
  latestEntry: DailyAccuracyEntry | null;
}

export interface WeeklyReportCard {
  weekStart: string;
  weekEnd: string;
  avgError: number;
  avgPercentError: number;
  symbolBreakdown: { symbol: string; avgError: number; avgPercentError: number }[];
}

// ─── Predictions ──────────────────────────────────────────

export interface UserPrediction {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  marketProbAtTime: number; // 0-100
  createdAt: number;
}

export interface PredictionStore {
  predictions: UserPrediction[];
}

export interface PredictionEvaluation {
  prediction: UserPrediction;
  currentMarketProb: number; // 0-100
  marketAgreement: 'agrees' | 'disagrees' | 'neutral';
  hypotheticalResult: 'correct' | 'incorrect' | 'unknown';
  brierScore: number;
}
