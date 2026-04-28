import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAllForecasts } from './useAllForecasts';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';
import { DigestSnapshot, SymbolDigest } from '../types/storage';
import { getDigestSnapshot, saveDigestSnapshot } from '../services/storageService';
import { computeFullDigest, buildCurrentSnapshot } from '../utils/digestAnalytics';

export function useDigest() {
  const forecasts = useAllForecasts();

  const [oldSnapshot, setOldSnapshot] = useState<DigestSnapshot | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);

  useEffect(() => {
    getDigestSnapshot().then((snap) => {
      setOldSnapshot(snap);
      setSnapshotLoaded(true);
    });
  }, []);

  const currentData = useMemo(
    () =>
      ALL_CRYPTO_KEYS.map((symbol) => ({
        symbol,
        forecasts: forecasts[symbol].forecasts,
      })),
    [forecasts],
  );

  const isLoading =
    !snapshotLoaded || ALL_CRYPTO_KEYS.some((s) => forecasts[s].isLoading);
  const hasData = ALL_CRYPTO_KEYS.some((s) => forecasts[s].forecasts.length > 0);

  // Auto-initialize baseline silently the first time we have forecast data
  // and no prior snapshot.
  useEffect(() => {
    if (!snapshotLoaded || oldSnapshot != null || !hasData) return;
    const initial = buildCurrentSnapshot(currentData);
    saveDigestSnapshot(initial).then(() => setOldSnapshot(initial));
  }, [snapshotLoaded, oldSnapshot, hasData, currentData]);

  const digests = useMemo<SymbolDigest[]>(() => {
    if (!hasData) return [];
    return computeFullDigest(oldSnapshot, currentData);
  }, [oldSnapshot, currentData, hasData]);

  const snapshotAge = oldSnapshot ? Date.now() - oldSnapshot.timestamp : null;

  const hasSignificantChanges = useMemo(
    () => digests.some((d) => d.bracketDiffs.some((diff) => Math.abs(diff.delta) >= 3)),
    [digests],
  );

  const markDigestSeen = useCallback(async () => {
    if (!hasData) return;
    const newSnapshot = buildCurrentSnapshot(currentData);
    await saveDigestSnapshot(newSnapshot);
    setOldSnapshot(newSnapshot);
  }, [currentData, hasData]);

  return {
    digests,
    isLoading,
    hasData,
    snapshotAge,
    isFirstVisit: false,
    hasSignificantChanges,
    markDigestSeen,
  };
}
