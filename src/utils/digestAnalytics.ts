import { PriceBracket, ForecastSeries } from '../types/market';
import {
  BracketSnapshot,
  SymbolSnapshot,
  DigestSnapshot,
  BracketDiff,
  SymbolDigest,
} from '../types/storage';

export function bracketToSnapshot(b: PriceBracket): BracketSnapshot {
  return {
    ticker: b.ticker,
    displayRange: b.displayRange,
    probability: b.probability,
    floorStrike: b.floorStrike,
    capStrike: b.capStrike,
  };
}

export function forecastToSymbolSnapshot(
  symbol: string,
  forecasts: ForecastSeries[],
): SymbolSnapshot {
  const eoy = forecasts.find((f) => f.type === 'eoy');
  return {
    symbol,
    expectedValue: eoy?.expectedValue ?? null,
    brackets: eoy?.brackets.map(bracketToSnapshot) ?? [],
    timestamp: Date.now(),
  };
}

export function computeBracketDiffs(
  oldBrackets: BracketSnapshot[],
  newBrackets: BracketSnapshot[],
): BracketDiff[] {
  const oldMap = new Map(oldBrackets.map((b) => [b.displayRange, b.probability]));
  const diffs: BracketDiff[] = [];

  for (const nb of newBrackets) {
    const oldProb = oldMap.get(nb.displayRange) ?? 0;
    const delta = nb.probability - oldProb;
    if (delta !== 0) {
      diffs.push({
        displayRange: nb.displayRange,
        oldProb,
        newProb: nb.probability,
        delta,
      });
    }
  }

  // Check for brackets that existed in old but not in new
  const newRanges = new Set(newBrackets.map((b) => b.displayRange));
  for (const ob of oldBrackets) {
    if (!newRanges.has(ob.displayRange) && ob.probability > 0) {
      diffs.push({
        displayRange: ob.displayRange,
        oldProb: ob.probability,
        newProb: 0,
        delta: -ob.probability,
      });
    }
  }

  // Sort by absolute delta descending
  diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return diffs;
}

export function computeSymbolDigest(
  symbol: string,
  oldSnap: SymbolSnapshot | undefined,
  newSnap: SymbolSnapshot,
): SymbolDigest {
  const oldBrackets = oldSnap?.brackets ?? [];
  const bracketDiffs = computeBracketDiffs(oldBrackets, newSnap.brackets);

  const oldEV = oldSnap?.expectedValue ?? null;
  const newEV = newSnap.expectedValue;
  const evDelta =
    oldEV != null && newEV != null ? newEV - oldEV : null;

  return {
    symbol,
    oldExpectedValue: oldEV,
    newExpectedValue: newEV,
    expectedValueDelta: evDelta,
    bracketDiffs,
    biggestMover: bracketDiffs.length > 0 ? bracketDiffs[0] : null,
  };
}

export function computeFullDigest(
  oldSnapshot: DigestSnapshot | null,
  currentData: { symbol: string; forecasts: ForecastSeries[] }[],
): SymbolDigest[] {
  const oldSymMap = new Map(
    (oldSnapshot?.symbols ?? []).map((s) => [s.symbol, s]),
  );

  const digests = currentData.map(({ symbol, forecasts }) => {
    const newSnap = forecastToSymbolSnapshot(symbol, forecasts);
    const oldSnap = oldSymMap.get(symbol);
    return computeSymbolDigest(symbol, oldSnap, newSnap);
  });

  // Sort by biggest absolute expected value delta
  digests.sort((a, b) => {
    const aDelta = Math.abs(a.expectedValueDelta ?? 0);
    const bDelta = Math.abs(b.expectedValueDelta ?? 0);
    return bDelta - aDelta;
  });

  return digests;
}

export function buildCurrentSnapshot(
  currentData: { symbol: string; forecasts: ForecastSeries[] }[],
): DigestSnapshot {
  return {
    symbols: currentData.map(({ symbol, forecasts }) =>
      forecastToSymbolSnapshot(symbol, forecasts),
    ),
    timestamp: Date.now(),
  };
}
