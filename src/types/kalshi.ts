export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  status: string;
  strike_type: 'less' | 'greater' | 'between' | string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
  last_price_dollars: string;
  no_sub_title: string;
  floor_strike?: number;
  cap_strike?: number;
  volume_fp: string;
  open_interest_fp: string;
  result: string;
  [key: string]: unknown;
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor: string;
}
