import { useEffect, useRef } from 'react';
import { useForecast } from './useForecast';
import { checkAndNotifyShifts, updateBaselines } from '../services/notificationService';

const MIN_CHECK_INTERVAL = 60_000; // 1 minute throttle

export function useAlertMonitor() {
  const btc = useForecast('BTC');
  const eth = useForecast('ETH');
  const sol = useForecast('SOL');

  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) return;

    const symbols = [
      { symbol: 'BTC', forecasts: btc.forecasts },
      { symbol: 'ETH', forecasts: eth.forecasts },
      { symbol: 'SOL', forecasts: sol.forecasts },
    ];

    const allLoaded = symbols.every((s) => s.forecasts.length > 0);
    if (!allLoaded) return;

    lastCheckRef.current = now;

    for (const { symbol, forecasts } of symbols) {
      const eoy = forecasts.find((f) => f.type === 'eoy');
      if (!eoy) continue;

      checkAndNotifyShifts(symbol, eoy.brackets).then(() =>
        updateBaselines(symbol, eoy.brackets),
      );
    }
  }, [btc.forecasts, eth.forecasts, sol.forecasts]);
}
