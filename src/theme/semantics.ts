// Shared threshold → color/label rules. Previously duplicated across components.
import { colors } from './tokens';

export function confidenceColor(value: number): string {
  if (value >= 60) return colors.up;
  if (value >= 35) return colors.warning;
  return colors.down;
}

export function confidenceLabel(value: number): 'High' | 'Medium' | 'Low' {
  if (value >= 60) return 'High';
  if (value >= 35) return 'Medium';
  return 'Low';
}

export function directionColor(delta: number): string {
  if (delta > 0) return colors.up;
  if (delta < 0) return colors.down;
  return colors.text2;
}

export function freshnessColor(minutesAgo: number): string {
  if (minutesAgo < 5) return colors.up;
  if (minutesAgo < 30) return colors.warning;
  return colors.down;
}

export function cryptoColor(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return colors.btc;
    case 'ETH':
      return colors.eth;
    case 'SOL':
      return colors.sol;
    default:
      return colors.accent;
  }
}
