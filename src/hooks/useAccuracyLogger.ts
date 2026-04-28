import { useEffect, useRef } from 'react';
import { useAllForecasts } from './useAllForecasts';
import { useSpotPrices } from './useSpotPrices';
import { appendAccuracyEntry, getAccuracyLog } from '../services/storageService';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useAccuracyLogger() {
  const forecasts = useAllForecasts();
  const { data: spotPrices } = useSpotPrices();

  const loggedTodayRef = useRef(false);
  const todayRef = useRef(getTodayString());

  useEffect(() => {
    const today = getTodayString();
    if (today !== todayRef.current) {
      todayRef.current = today;
      loggedTodayRef.current = false;
    }

    if (loggedTodayRef.current) return;
    if (!spotPrices) return;

    const symbols = ALL_CRYPTO_KEYS.map((symbol) => ({
      symbol,
      forecasts: forecasts[symbol].forecasts,
      spot: spotPrices[symbol] ?? null,
    }));

    // Need at least one symbol with both data + spot to do useful work.
    const anyReady = symbols.some((s) => s.forecasts.length > 0 && s.spot != null);
    if (!anyReady) return;

    loggedTodayRef.current = true;

    (async () => {
      const log = await getAccuracyLog();
      const today = getTodayString();

      for (const { symbol, forecasts: fcs, spot } of symbols) {
        if (fcs.length === 0 || spot == null) continue;
        const alreadyLogged = log.entries.some(
          (e) => e.date === today && e.symbol === symbol,
        );
        if (alreadyLogged) continue;

        const eoy = fcs.find((f) => f.type === 'eoy');
        if (!eoy?.expectedValue) continue;

        await appendAccuracyEntry({
          date: today,
          symbol,
          expectedValue: eoy.expectedValue,
          spotPrice: spot,
          timestamp: Date.now(),
        });
      }
    })();
  }, [forecasts, spotPrices]);
}
