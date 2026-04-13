import { Colors } from './colors';

export interface TokenMeta {
  symbol: string;
  name: string;
  color: string;
  icon: string; // emoji fallback
}

export const TOKENS: Record<string, TokenMeta> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: Colors.btc,
    icon: '₿',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    color: Colors.eth,
    icon: 'Ξ',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    color: Colors.sol,
    icon: '◎',
  },
};
