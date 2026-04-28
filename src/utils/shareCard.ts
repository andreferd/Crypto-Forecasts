import { Share } from 'react-native';
import { ForecastSeries } from '../types/market';

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function generateShareText(
  symbol: string,
  name: string,
  forecasts: ForecastSeries[],
  spotPrice?: number | null,
): string {
  const lines: string[] = [`${symbol} (${name}) — market consensus`];

  if (spotPrice != null) {
    lines.push(`Current Price: ${formatPrice(spotPrice)}`);
  }

  lines.push('');

  for (const series of forecasts) {
    if (!series.mostLikelyBracket) continue;
    lines.push(
      `${series.label}: ${series.mostLikelyBracket.displayRange} (${series.mostLikelyBracket.probability}% likely)`,
    );
    if (series.expectedValue != null) {
      lines.push(`  Expected: ${formatPrice(series.expectedValue)}`);
    }
  }

  lines.push('');
  lines.push('Data from Kalshi prediction markets');
  lines.push('via Crowd Price');

  return lines.join('\n');
}

export async function shareForcast(
  symbol: string,
  name: string,
  forecasts: ForecastSeries[],
  spotPrice?: number | null,
): Promise<void> {
  const message = generateShareText(symbol, name, forecasts, spotPrice);
  await Share.share({ message, title: `${symbol} consensus` });
}
