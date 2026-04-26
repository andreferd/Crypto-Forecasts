import { useEffect, useRef } from 'react';
import { useForecast } from './useForecast';
import {
  getUserPredictions,
  getDriftNotified,
  saveDriftNotified,
  getAlertSettings,
} from '../services/storageService';
import { notifyPredictionDrift } from '../services/notificationService';
import { computeMarketProbForTarget } from '../utils/predictionScoring';

const MIN_CHECK_INTERVAL = 5 * 60_000;
const MIN_DRIFT_PP = 5;

/**
 * Watches user's open predictions and pushes a notification when the market's
 * implied probability drifts ≥ 5pp from the value when the prediction was made.
 *
 * Lives alongside useAlertMonitor — both are mounted in BackgroundServices.
 */
export function usePredictionDriftMonitor() {
  const btc = useForecast('BTC');
  const eth = useForecast('ETH');
  const sol = useForecast('SOL');

  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) return;

    const bracketsBySymbol: Record<string, ReturnType<typeof Object>['_'] | undefined> = {};
    const map: Record<string, any> = {
      BTC: btc.forecasts.find((f) => f.type === 'eoy')?.brackets,
      ETH: eth.forecasts.find((f) => f.type === 'eoy')?.brackets,
      SOL: sol.forecasts.find((f) => f.type === 'eoy')?.brackets,
    };
    for (const sym of Object.keys(map)) {
      bracketsBySymbol[sym] = map[sym];
    }

    const allLoaded = ['BTC', 'ETH', 'SOL'].every((s) => map[s] && map[s].length > 0);
    if (!allLoaded) return;

    lastCheckRef.current = now;

    (async () => {
      const settings = await getAlertSettings();
      if (!settings.enabled) return;

      const predictions = await getUserPredictions();
      if (predictions.length === 0) return;

      const notified = await getDriftNotified();
      const updated = { ...notified };
      let changed = false;

      for (const p of predictions) {
        const brackets = map[p.symbol];
        if (!brackets) continue;
        const currentProb = computeMarketProbForTarget(brackets, p.targetPrice, p.direction);
        const drift = currentProb - p.marketProbAtTime;
        const absDrift = Math.abs(drift);
        const lastNotified = notified[p.id] ?? 0;

        // Notify if (a) we've never notified, or (b) drift has grown by ≥3pp beyond last notice
        if (absDrift >= MIN_DRIFT_PP && absDrift >= Math.abs(lastNotified) + 3) {
          await notifyPredictionDrift({
            symbol: p.symbol,
            direction: p.direction,
            targetPrice: p.targetPrice,
            oldProb: p.marketProbAtTime,
            newProb: currentProb,
          });
          updated[p.id] = drift;
          changed = true;
        }
      }

      // Prune notified entries for predictions that no longer exist
      const liveIds = new Set(predictions.map((p) => p.id));
      for (const id of Object.keys(updated)) {
        if (!liveIds.has(id)) {
          delete updated[id];
          changed = true;
        }
      }

      if (changed) await saveDriftNotified(updated);
    })();
  }, [btc.forecasts, eth.forecasts, sol.forecasts]);
}
