import { useEffect, useRef } from 'react';
import { useAllForecasts } from './useAllForecasts';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';
import {
  getUserPredictions,
  getDriftNotified,
  saveDriftNotified,
  getAlertSettings,
} from '../services/storageService';
import { notifyPredictionDrift } from '../services/notificationService';
import { computeMarketProbForTarget } from '../utils/predictionScoring';
import { PriceBracket } from '../types/market';

const MIN_CHECK_INTERVAL = 5 * 60_000;
const MIN_DRIFT_PP = 5;

/**
 * Watches user's open predictions and pushes a notification when the market's
 * implied probability drifts ≥ 5pp from the value when the prediction was made.
 */
export function usePredictionDriftMonitor() {
  const forecasts = useAllForecasts();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) return;

    const bracketsBySymbol: Record<string, PriceBracket[]> = {};
    for (const sym of ALL_CRYPTO_KEYS) {
      const brackets = forecasts[sym].forecasts.find((f) => f.type === 'eoy')?.brackets;
      if (brackets && brackets.length > 0) bracketsBySymbol[sym] = brackets;
    }
    if (Object.keys(bracketsBySymbol).length === 0) return;

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
        const brackets = bracketsBySymbol[p.symbol];
        if (!brackets) continue;
        const currentProb = computeMarketProbForTarget(brackets, p.targetPrice, p.direction);
        const drift = currentProb - p.marketProbAtTime;
        const absDrift = Math.abs(drift);
        const lastNotified = notified[p.id] ?? 0;

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
  }, [forecasts]);
}
