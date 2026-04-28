import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPrediction, PredictionEvaluation } from '../types/storage';
import {
  getUserPredictions,
  addUserPrediction,
  removeUserPrediction,
} from '../services/storageService';
import { useAllForecasts } from './useAllForecasts';
import { useSpotPrices } from './useSpotPrices';
import { computeMarketProbForTarget, evaluatePrediction } from '../utils/predictionScoring';

export function usePredictions() {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [loaded, setLoaded] = useState(false);

  const forecasts = useAllForecasts();
  const { data: spotPrices } = useSpotPrices();

  useEffect(() => {
    getUserPredictions().then((p) => {
      setPredictions(p);
      setLoaded(true);
    });
  }, []);

  const makePrediction = useCallback(
    async (symbol: string, targetPrice: number, direction: 'above' | 'below') => {
      const eoy = forecasts[symbol]?.forecasts.find((f) => f.type === 'eoy');
      const brackets = eoy?.brackets ?? [];

      const marketProbAtTime = computeMarketProbForTarget(brackets, targetPrice, direction);

      const prediction: UserPrediction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        symbol,
        targetPrice,
        direction,
        marketProbAtTime,
        createdAt: Date.now(),
      };

      await addUserPrediction(prediction);
      setPredictions((prev) => [...prev, prediction]);
      return prediction;
    },
    [forecasts],
  );

  const deletePrediction = useCallback(async (id: string) => {
    await removeUserPrediction(id);
    setPredictions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const evaluations = useMemo<PredictionEvaluation[]>(() => {
    return predictions.map((p) => {
      const eoy = forecasts[p.symbol]?.forecasts.find((f) => f.type === 'eoy');
      const brackets = eoy?.brackets ?? [];
      const spot = spotPrices?.[p.symbol] ?? null;
      return evaluatePrediction(p, spot, brackets);
    });
  }, [predictions, forecasts, spotPrices]);

  return {
    predictions,
    evaluations,
    loaded,
    makePrediction,
    deletePrediction,
  };
}
