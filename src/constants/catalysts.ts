export interface CatalystEvent {
  date: string; // YYYY-MM-DD
  label: string;
  symbol: string | 'ALL'; // which crypto it affects
}

export const CATALYST_EVENTS: CatalystEvent[] = [
  { date: '2025-04-15', label: 'Tax Day', symbol: 'ALL' },
  { date: '2025-05-01', label: 'ETH Pectra Upgrade', symbol: 'ETH' },
  { date: '2025-06-15', label: 'FOMC Meeting', symbol: 'ALL' },
  { date: '2025-07-30', label: 'FOMC Meeting', symbol: 'ALL' },
  { date: '2025-09-17', label: 'FOMC Meeting', symbol: 'ALL' },
  { date: '2025-12-17', label: 'FOMC Meeting', symbol: 'ALL' },
  { date: '2025-01-20', label: 'BTC Spot ETF Options', symbol: 'BTC' },
  { date: '2025-10-01', label: 'SOL Firedancer', symbol: 'SOL' },
];

export function getCatalystsForSymbol(symbol: string): CatalystEvent[] {
  return CATALYST_EVENTS.filter(
    (e) => e.symbol === symbol || e.symbol === 'ALL',
  );
}
