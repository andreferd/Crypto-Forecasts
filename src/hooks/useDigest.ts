import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForecast } from './useForecast';
import { DigestSnapshot, SymbolDigest } from '../types/storage';
import { getDigestSnapshot, saveDigestSnapshot } from '../services/storageService';
import { computeFullDigest, buildCurrentSnapshot } from '../utils/digestAnalytics';

export function useDigest() {
  const btc = useForecast('BTC');
  const eth = useForecast('ETH');
  const sol = useForecast('SOL');

  const [oldSnapshot, setOldSnapshot] = useState<DigestSnapshot | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);

  useEffect(() => {
    getDigestSnapshot().then((snap) => {
      setOldSnapshot(snap);
      setSnapshotLoaded(true);
    });
  }, []);

  const currentData = useMemo(
    () => [
      { symbol: 'BTC', forecasts: btc.forecasts },
      { symbol: 'ETH', forecasts: eth.forecasts },
      { symbol: 'SOL', forecasts: sol.forecasts },
    ],
    [btc.forecasts, eth.forecasts, sol.forecasts],
  );

  const isLoading = !snapshotLoaded || btc.isLoading || eth.isLoading || sol.isLoading;
  const hasData = btc.forecasts.length > 0 || eth.forecasts.length > 0 || sol.forecasts.length > 0;

  // Auto-initialize baseline silently the first time we have forecast data
  // and no prior snapshot. Avoids any "welcome to digest" UX.
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
    isFirstVisit: false, // legacy; auto-init means we never expose this state to UI
    hasSignificantChanges,
    markDigestSeen,
  };
}
