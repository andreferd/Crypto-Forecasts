import { useEffect, useRef } from 'react';
import { useAllForecasts } from './useAllForecasts';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';
import { checkAndNotifyShifts, updateBaselines } from '../services/notificationService';

const MIN_CHECK_INTERVAL = 60_000; // 1 minute throttle

export function useAlertMonitor() {
  const forecasts = useAllForecasts();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) return;

    const ready = ALL_CRYPTO_KEYS.filter((s) => forecasts[s].forecasts.length > 0);
    if (ready.length === 0) return;

    lastCheckRef.current = now;

    for (const symbol of ready) {
      const eoy = forecasts[symbol].forecasts.find((f) => f.type === 'eoy');
      if (!eoy) continue;
      checkAndNotifyShifts(symbol, eoy.brackets).then(() =>
        updateBaselines(symbol, eoy.brackets),
      );
    }
  }, [forecasts]);
}
