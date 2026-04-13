import { PriceBracket } from '../types/market';
import { UserPrediction, PredictionEvaluation } from '../types/storage';

/**
 * Compute the market-implied probability that the price will be
 * above or below a target, based on bracket probabilities.
 */
export function computeMarketProbForTarget(
  brackets: PriceBracket[],
  targetPrice: number,
  direction: 'above' | 'below',
): number {
  let probAbove = 0;
  let probBelow = 0;

  for (const b of brackets) {
    const floor = b.floorStrike ?? -Infinity;
    const cap = b.capStrike ?? Infinity;

    if (floor >= targetPrice) {
      // Entire bracket is above target
      probAbove += b.probability;
    } else if (cap <= targetPrice) {
      // Entire bracket is below target
      probBelow += b.probability;
    } else {
      // Target falls within this bracket — split proportionally
      const range = (b.capStrike ?? floor * 1.2) - (b.floorStrike ?? cap * 0.8);
      if (range > 0) {
        const aboveFraction = ((b.capStrike ?? floor * 1.2) - targetPrice) / range;
        probAbove += b.probability * Math.max(0, Math.min(1, aboveFraction));
        probBelow += b.probability * Math.max(0, Math.min(1, 1 - aboveFraction));
      } else {
        // Degenerate bracket, split 50/50
        probAbove += b.probability / 2;
        probBelow += b.probability / 2;
      }
    }
  }

  const result = direction === 'above' ? probAbove : probBelow;
  return Math.round(Math.max(0, Math.min(100, result)));
}

/**
 * Evaluate a user prediction against current market data.
 */
export function evaluatePrediction(
  prediction: UserPrediction,
  currentSpot: number | null,
  brackets: PriceBracket[],
): PredictionEvaluation {
  const currentMarketProb = computeMarketProbForTarget(
    brackets,
    prediction.targetPrice,
    prediction.direction,
  );

  // Agreement: does the market give >50% to the user's prediction?
  let marketAgreement: PredictionEvaluation['marketAgreement'] = 'neutral';
  if (currentMarketProb >= 55) {
    marketAgreement = 'agrees';
  } else if (currentMarketProb <= 45) {
    marketAgreement = 'disagrees';
  }

  // Hypothetical: if resolved today with current spot price
  let hypotheticalResult: PredictionEvaluation['hypotheticalResult'] = 'unknown';
  if (currentSpot != null) {
    const isAbove = currentSpot >= prediction.targetPrice;
    if (prediction.direction === 'above') {
      hypotheticalResult = isAbove ? 'correct' : 'incorrect';
    } else {
      hypotheticalResult = isAbove ? 'incorrect' : 'correct';
    }
  }

  // Brier score: how well calibrated was the prediction vs outcome
  // Using market probability as the "forecast" and hypothetical as outcome
  const outcome = hypotheticalResult === 'correct' ? 1 : hypotheticalResult === 'incorrect' ? 0 : 0.5;
  const forecast = currentMarketProb / 100;
  const brierScore = Math.round((forecast - outcome) * (forecast - outcome) * 1000) / 1000;

  return {
    prediction,
    currentMarketProb,
    marketAgreement,
    hypotheticalResult,
    brierScore,
  };
}
