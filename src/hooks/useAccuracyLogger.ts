import { useEffect, useRef } from 'react';
import { useForecast } from './useForecast';
import { useSpotPrices } from './useSpotPrices';
import { appendAccuracyEntry, getAccuracyLog } from '../services/storageService';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useAccuracyLogger() {
  const btc = useForecast('BTC');
  const eth = useForecast('ETH');
  const sol = useForecast('SOL');
  const { data: spotPrices } = useSpotPrices();

  const loggedTodayRef = useRef(false);
  const todayRef = useRef(getTodayString());

  useEffect(() => {
    // Reset if the day changed
    const today = getTodayString();
    if (today !== todayRef.current) {
      todayRef.current = today;
      loggedTodayRef.current = false;
    }

    if (loggedTodayRef.current) return;
    if (!spotPrices) return;

    const symbols = [
      { symbol: 'BTC' as const, forecasts: btc.forecasts, spot: spotPrices.BTC },
      { symbol: 'ETH' as const, forecasts: eth.forecasts, spot: spotPrices.ETH },
      { symbol: 'SOL' as const, forecasts: sol.forecasts, spot: spotPrices.SOL },
    ];

    // Check all have data
    const allReady = symbols.every((s) => s.forecasts.length > 0 && s.spot != null);
    if (!allReady) return;

    loggedTodayRef.current = true;

    (async () => {
      const log = await getAccuracyLog();
      const today = getTodayString();

      for (const { symbol, forecasts, spot } of symbols) {
        // Skip if already logged today for this symbol
        const alreadyLogged = log.entries.some(
          (e) => e.date === today && e.symbol === symbol,
        );
        if (alreadyLogged) continue;

        const eoy = forecasts.find((f) => f.type === 'eoy');
        if (!eoy?.expectedValue || !spot) continue;

        await appendAccuracyEntry({
          date: today,
          symbol,
          expectedValue: eoy.expectedValue,
          spotPrice: spot,
          timestamp: Date.now(),
        });
      }
    })();
  }, [btc.forecasts, eth.forecasts, sol.forecasts, spotPrices]);
}
