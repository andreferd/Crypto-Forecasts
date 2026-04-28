import { colors } from '../theme/tokens';

export interface TokenMeta {
  symbol: string;
  name: string;
  color: string;
  icon: string;
}

export const TOKENS: Record<string, TokenMeta> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', color: colors.btc, icon: '₿' },
  ETH: { symbol: 'ETH', name: 'Ethereum', color: colors.eth, icon: 'Ξ' },
  SOL: { symbol: 'SOL', name: 'Solana', color: colors.sol, icon: '◎' },
  XRP: { symbol: 'XRP', name: 'Ripple', color: colors.xrp, icon: '✕' },
  DOGE: { symbol: 'DOGE', name: 'Dogecoin', color: colors.doge, icon: 'Ð' },
  BNB: { symbol: 'BNB', name: 'BNB', color: colors.bnb, icon: 'ʙ' },
};
