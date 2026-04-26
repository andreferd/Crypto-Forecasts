import { parseMarketsToBrackets, buildForecastSeries } from './kalshiParser';
import { KalshiMarket } from '../types/kalshi';

function makeMarket(partial: Partial<KalshiMarket>): KalshiMarket {
  return {
    ticker: 'T',
    event_ticker: 'E',
    title: 'title',
    status: 'active',
    strike_type: 'between',
    yes_bid_dollars: '0.50',
    yes_ask_dollars: '0.55',
    no_bid_dollars: '0.45',
    no_ask_dollars: '0.50',
    last_price_dollars: '0.50',
    no_sub_title: 'range',
    volume_fp: '0',
    open_interest_fp: '0',
    result: '',
    ...partial,
  };
}

describe('parseMarketsToBrackets', () => {
  describe('probability parsing', () => {
    it('converts yes_bid_dollars (0.XX) to 0-100 probability', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({ yes_bid_dollars: '0.70', floor_strike: 0, cap_strike: 100 }),
      ]);
      expect(b.probability).toBe(70);
    });

    it('rounds half-cents correctly', () => {
      // 0.019 * 100 = 1.9 → rounds to 2
      const [b] = parseMarketsToBrackets([
        makeMarket({ yes_bid_dollars: '0.019', floor_strike: 0, cap_strike: 100 }),
      ]);
      expect(b.probability).toBe(2);
    });

    it('falls back to last_price_dollars when yes_bid rounds to 0', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.0040', // rounds to 0
          last_price_dollars: '0.33',
          floor_strike: 0,
          cap_strike: 100,
        }),
      ]);
      expect(b.probability).toBe(33);
    });

    it('falls back to last_price when yes_bid is unparseable', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: 'garbage',
          last_price_dollars: '0.25',
          floor_strike: 0,
          cap_strike: 100,
        }),
      ]);
      expect(b.probability).toBe(25);
    });

    it('filters brackets with 0 probability after both sources fail', () => {
      const markets = [
        makeMarket({
          yes_bid_dollars: '0',
          last_price_dollars: '0',
          floor_strike: 0,
          cap_strike: 100,
        }),
        makeMarket({
          yes_bid_dollars: '0.40',
          floor_strike: 100,
          cap_strike: 200,
        }),
      ];
      const result = parseMarketsToBrackets(markets);
      expect(result).toHaveLength(1);
      expect(result[0].probability).toBe(40);
    });
  });

  describe('sorting', () => {
    it('sorts by floorStrike ascending, null floor first', () => {
      const markets = [
        makeMarket({
          ticker: 'MID',
          yes_bid_dollars: '0.3',
          floor_strike: 100,
          cap_strike: 200,
        }),
        makeMarket({
          ticker: 'LOW',
          yes_bid_dollars: '0.2',
          strike_type: 'less',
          cap_strike: 50,
          // no floor_strike → floorStrike: null
        }),
        makeMarket({
          ticker: 'HI',
          yes_bid_dollars: '0.4',
          strike_type: 'greater',
          floor_strike: 200,
        }),
      ];
      const tickers = parseMarketsToBrackets(markets).map((b) => b.ticker);
      expect(tickers).toEqual(['LOW', 'MID', 'HI']);
    });
  });

  describe('label', () => {
    it('prefers no_sub_title', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          no_sub_title: 'between 100 and 200',
          title: 'Full market title',
          floor_strike: 100,
          cap_strike: 200,
        }),
      ]);
      expect(b.label).toBe('between 100 and 200');
    });

    it('falls back to title if no_sub_title is empty', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          no_sub_title: '',
          title: 'Full market title',
          floor_strike: 100,
          cap_strike: 200,
        }),
      ]);
      expect(b.label).toBe('Full market title');
    });
  });

  describe('displayRange + formatPrice (via output)', () => {
    it('formats "between" with both strikes', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'between',
          floor_strike: 100_000,
          cap_strike: 110_000,
        }),
      ]);
      // 100_000 → "$100k" (>=10000 → toFixed(0)); 110_000 → "$110k"
      expect(b.displayRange).toBe('$100k - $110k');
    });

    it('formats "greater" as "X+"', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'greater',
          floor_strike: 200_000,
        }),
      ]);
      expect(b.displayRange).toBe('$200k+');
    });

    it('formats "less" as "< X"', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'less',
          cap_strike: 50_000,
        }),
      ]);
      expect(b.displayRange).toBe('< $50k');
    });

    it('formats values under 1k using toLocaleString', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'less',
          cap_strike: 500,
        }),
      ]);
      expect(b.displayRange).toBe('< $500');
    });

    it('formats values between 1k and 10k with one decimal', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'greater',
          floor_strike: 1500,
        }),
      ]);
      expect(b.displayRange).toBe('$1.5k+');
    });

    it('formats values ≥ 1M with "M" suffix, 2 decimals', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'greater',
          floor_strike: 1_500_000,
        }),
      ]);
      expect(b.displayRange).toBe('$1.50M+');
    });

    it('returns "Unknown" when strike_type is unrecognized and no strikes set', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'weird',
          // no floor_strike, no cap_strike
        }),
      ]);
      expect(b.displayRange).toBe('Unknown');
    });

    it('uses fallback between-range when strike_type is unrecognized but both strikes present', () => {
      const [b] = parseMarketsToBrackets([
        makeMarket({
          yes_bid_dollars: '0.5',
          strike_type: 'weird',
          floor_strike: 100,
          cap_strike: 200,
        }),
      ]);
      expect(b.displayRange).toBe('$100 - $200');
    });
  });

  it('propagates volume and openInterest as floats', () => {
    const [b] = parseMarketsToBrackets([
      makeMarket({
        yes_bid_dollars: '0.5',
        floor_strike: 0,
        cap_strike: 100,
        volume_fp: '12345.67',
        open_interest_fp: '89',
      }),
    ]);
    expect(b.volume).toBe(12345.67);
    expect(b.openInterest).toBe(89);
  });

  it('treats unparseable volume/openInterest as 0', () => {
    const [b] = parseMarketsToBrackets([
      makeMarket({
        yes_bid_dollars: '0.5',
        floor_strike: 0,
        cap_strike: 100,
        volume_fp: '',
        open_interest_fp: 'abc',
      }),
    ]);
    expect(b.volume).toBe(0);
    expect(b.openInterest).toBe(0);
  });
});

describe('buildForecastSeries', () => {
  it('identifies mostLikelyBracket by highest probability', () => {
    const markets = [
      makeMarket({
        ticker: 'A',
        yes_bid_dollars: '0.20',
        floor_strike: 0,
        cap_strike: 100,
      }),
      makeMarket({
        ticker: 'B',
        yes_bid_dollars: '0.55',
        floor_strike: 100,
        cap_strike: 200,
      }),
      makeMarket({
        ticker: 'C',
        yes_bid_dollars: '0.25',
        floor_strike: 200,
        cap_strike: 300,
      }),
    ];
    const series = buildForecastSeries('eoy', 'End of Year', 'KXBTCY', markets);
    expect(series.mostLikelyBracket?.ticker).toBe('B');
    expect(series.brackets).toHaveLength(3);
  });

  it('returns empty shape when there are no markets', () => {
    const series = buildForecastSeries('eoy', 'L', 'S', []);
    expect(series.brackets).toEqual([]);
    expect(series.mostLikelyBracket).toBeNull();
    expect(series.expectedValue).toBeNull();
  });

  it('computes expectedValue as a probability-weighted midpoint', () => {
    // Bracket A: 0-100 @ 25% → midpoint 50 → contributes 50 * 0.25 = 12.5
    // Bracket B: 100-200 @ 25% → midpoint 150 → contributes 37.5
    // Bracket C: 200-300 @ 50% → midpoint 250 → contributes 125
    // total weight = 1.0 → EV = 175
    const markets = [
      makeMarket({ yes_bid_dollars: '0.25', floor_strike: 0, cap_strike: 100 }),
      makeMarket({ yes_bid_dollars: '0.25', floor_strike: 100, cap_strike: 200 }),
      makeMarket({ yes_bid_dollars: '0.50', floor_strike: 200, cap_strike: 300 }),
    ];
    const series = buildForecastSeries('eoy', 'L', 'S', markets);
    expect(series.expectedValue).toBe(175);
  });

  it('handles open-ended top bracket (null capStrike) using floor * 1.1', () => {
    // Bracket A: 0-100 @ 50% → midpoint 50 → 25
    // Bracket B: floor 200, no cap → uses 200*1.1 = 220 @ 50% → 110
    // EV = 135
    const markets = [
      makeMarket({
        yes_bid_dollars: '0.50',
        strike_type: 'between',
        floor_strike: 0,
        cap_strike: 100,
      }),
      makeMarket({
        yes_bid_dollars: '0.50',
        strike_type: 'greater',
        floor_strike: 200,
      }),
    ];
    const series = buildForecastSeries('eoy', 'L', 'S', markets);
    expect(series.expectedValue).toBe(135);
  });

  it('handles open-ended bottom bracket (null floorStrike) using cap * 0.9', () => {
    // Bracket A: cap 100, no floor → 100*0.9 = 90 @ 50% → 45
    // Bracket B: 100-200 @ 50% → midpoint 150 → 75
    // EV = 120
    const markets = [
      makeMarket({
        yes_bid_dollars: '0.50',
        strike_type: 'less',
        cap_strike: 100,
      }),
      makeMarket({
        yes_bid_dollars: '0.50',
        strike_type: 'between',
        floor_strike: 100,
        cap_strike: 200,
      }),
    ];
    const series = buildForecastSeries('eoy', 'L', 'S', markets);
    expect(series.expectedValue).toBe(120);
  });

  it('returns null expectedValue when no bracket has strike info', () => {
    const markets = [
      makeMarket({
        yes_bid_dollars: '0.50',
        strike_type: 'weird',
        // no strikes at all
      }),
    ];
    const series = buildForecastSeries('eoy', 'L', 'S', markets);
    expect(series.expectedValue).toBeNull();
  });

  it('preserves type, label, seriesTicker in output', () => {
    const series = buildForecastSeries('max', 'Yearly High', 'KXBTCMAXY', []);
    expect(series.type).toBe('max');
    expect(series.label).toBe('Yearly High');
    expect(series.seriesTicker).toBe('KXBTCMAXY');
  });
});
