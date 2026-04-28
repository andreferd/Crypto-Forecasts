import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { CRYPTO_TICKERS } from '../constants/kalshi';
import { useForecastHistory } from '../hooks/useForecastHistory';
import { useSpotHistory } from '../hooks/useSpotHistory';
import { ForecastPoint } from '../services/forecastHistory';
import { SpotHistoryPoint } from '../services/coinGeckoApi';

interface Props {
  symbol: string;
  days?: number;
}

const HEIGHT = 156;
const PAD = { top: 16, bottom: 24, left: 48, right: 18 };

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Forecast (Kalshi consensus EV) vs spot price (CoinGecko) over time.
 * Uses live data sources, not the daily local log — works from first launch.
 */
export function TrackRecordChart({ symbol, days = 90 }: Props) {
  const [width, setWidth] = useState(280);

  const tickers = CRYPTO_TICKERS[symbol] ?? [];
  const eoyTicker = tickers.find((t) => t.type === 'eoy')?.seriesTicker;
  const { data: forecastHistory, isLoading: loadingForecast } = useForecastHistory(eoyTicker, days);
  const { data: spotHistory, isLoading: loadingSpot } = useSpotHistory(symbol, days);

  const drawW = Math.max(0, width - PAD.left - PAD.right);
  const drawH = HEIGHT - PAD.top - PAD.bottom;

  const token = TOKENS[symbol];
  const forecastColor = token?.color ?? colors.accent;
  const spotColor = colors.text1;

  const computed = useMemo(
    () => buildChart(forecastHistory, spotHistory, drawW, drawH),
    [forecastHistory, spotHistory, drawW, drawH],
  );

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const isLoading = loadingForecast || loadingSpot;

  if (isLoading && !computed) {
    return (
      <View style={styles.container}>
        <ChartHeader symbol={symbol} forecastColor={forecastColor} />
        <View style={styles.skeleton} onLayout={onLayout}>
          <View style={[styles.skeletonLine, { backgroundColor: forecastColor + '33', top: '35%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: spotColor + '22', top: '60%' }]} />
        </View>
        <View style={styles.legend}>
          <LegendDot color={forecastColor} label="Consensus" dashed />
          <LegendDot color={spotColor} label="Spot" />
        </View>
      </View>
    );
  }

  if (!computed) {
    return (
      <View style={styles.container}>
        <ChartHeader symbol={symbol} forecastColor={forecastColor} />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon source="chart-line-variant" size={24} color={colors.text3} />
          </View>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            We'll plot the year-end consensus against spot once we have enough trades.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChartHeader symbol={symbol} forecastColor={forecastColor} />

      <View style={{ position: 'relative' }} onLayout={onLayout}>
        <Svg width={width} height={HEIGHT}>
          {computed.yLabels.map((yl, i) => (
            <Line
              key={i}
              x1={PAD.left}
              y1={yl.y}
              x2={width - PAD.right}
              y2={yl.y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          ))}

          <Polyline
            points={computed.spotPoints}
            fill="none"
            stroke={spotColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Polyline
            points={computed.forecastPoints}
            fill="none"
            stroke={forecastColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="5,3"
          />

          <Circle cx={computed.lastSpot.x} cy={computed.lastSpot.y} r={3} fill={spotColor} />
          <Circle
            cx={computed.lastForecast.x}
            cy={computed.lastForecast.y}
            r={3}
            fill={forecastColor}
          />
        </Svg>

        {computed.yLabels.map((yl, i) => (
          <View key={`yl-${i}`} style={[styles.yLabel, { top: yl.y - 6 }]}>
            <Text style={styles.axisText}>{formatPrice(yl.v)}</Text>
          </View>
        ))}

        <View
          style={[
            styles.xLabels,
            { paddingLeft: PAD.left, paddingRight: PAD.right },
          ]}
        >
          <Text style={[styles.axisText, { textAlign: 'left' }]}>
            {formatDate(computed.minT)}
          </Text>
          <Text style={[styles.axisText, { textAlign: 'right' }]}>
            {formatDate(computed.maxT)}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendDot color={forecastColor} label="Consensus" dashed />
        <LegendDot color={spotColor} label="Spot" />
        <View style={{ flex: 1 }} />
        <Text style={styles.errorText}>
          Today off by {formatPrice(computed.latestError)} ({computed.latestPctError.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
}

interface ComputedChart {
  forecastPoints: string;
  spotPoints: string;
  yLabels: { v: number; y: number }[];
  minT: number;
  maxT: number;
  lastForecast: { x: number; y: number };
  lastSpot: { x: number; y: number };
  latestError: number;
  latestPctError: number;
}

function buildChart(
  forecastHistory: ForecastPoint[] | undefined,
  spotHistory: SpotHistoryPoint[] | undefined,
  drawW: number,
  drawH: number,
): ComputedChart | null {
  if (!forecastHistory || forecastHistory.length < 2) return null;
  if (!spotHistory || spotHistory.length < 2) return null;

  // Align both series to the overlapping time window
  const minT = Math.max(forecastHistory[0].timestamp, spotHistory[0].timestamp);
  const maxT = Math.min(
    forecastHistory[forecastHistory.length - 1].timestamp,
    spotHistory[spotHistory.length - 1].timestamp,
  );
  if (maxT <= minT) return null;
  const tRange = maxT - minT;

  const fclip = forecastHistory.filter((p) => p.timestamp >= minT && p.timestamp <= maxT);
  const sclip = spotHistory.filter((p) => p.timestamp >= minT && p.timestamp <= maxT);
  if (fclip.length < 2 || sclip.length < 2) return null;

  const allValues = [...fclip.map((p) => p.forecast), ...sclip.map((p) => p.price)];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const pad = (maxV - minV) * 0.18 || maxV * 0.08;
  const lo = minV - pad;
  const hi = maxV + pad;
  const vRange = hi - lo;

  const x = (t: number) => PAD.left + ((t - minT) / tRange) * drawW;
  const y = (v: number) => PAD.top + drawH - ((v - lo) / vRange) * drawH;

  const forecastPoints = fclip
    .map((p) => `${x(p.timestamp).toFixed(1)},${y(p.forecast).toFixed(1)}`)
    .join(' ');
  const spotPoints = sclip
    .map((p) => `${x(p.timestamp).toFixed(1)},${y(p.price).toFixed(1)}`)
    .join(' ');

  const ticks = 3;
  const yLabels = Array.from({ length: ticks }, (_, i) => {
    const v = hi - (i / (ticks - 1)) * (hi - lo);
    return { v, y: PAD.top + (i / (ticks - 1)) * drawH };
  });

  const lastF = fclip[fclip.length - 1];
  const lastS = sclip[sclip.length - 1];

  return {
    forecastPoints,
    spotPoints,
    yLabels,
    minT,
    maxT,
    lastForecast: { x: x(lastF.timestamp), y: y(lastF.forecast) },
    lastSpot: { x: x(lastS.timestamp), y: y(lastS.price) },
    latestError: Math.abs(lastF.forecast - lastS.price),
    latestPctError:
      lastS.price > 0 ? Math.abs((lastF.forecast - lastS.price) / lastS.price) * 100 : 0,
  };
}

function ChartHeader({ symbol, forecastColor }: { symbol: string; forecastColor: string }) {
  const token = TOKENS[symbol];
  return (
    <View style={styles.headerRow}>
      <View style={[styles.glyph, { borderColor: forecastColor + '66' }]}>
        <Text style={[styles.glyphText, { color: forecastColor }]}>{token?.icon ?? '?'}</Text>
      </View>
      <Text style={styles.headerSymbol}>{symbol}</Text>
      <Text style={styles.headerName}>{token?.name ?? symbol}</Text>
    </View>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendLine,
          dashed
            ? { borderColor: color, borderStyle: 'dashed', borderWidth: 1, height: 0 }
            : { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  glyph: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphText: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  headerSymbol: {
    ...typography.bodyStrong,
    color: colors.text1,
  },
  headerName: {
    ...typography.caption,
    color: colors.text2,
    flex: 1,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: PAD.left - 4,
  },
  axisText: {
    ...typography.caption,
    fontSize: 9,
    lineHeight: 11,
    color: colors.text3,
    textAlign: 'right',
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.md,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  legendLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
  },
  errorText: {
    ...typography.captionStrong,
    fontSize: 11,
    color: colors.text2,
  },
  skeleton: {
    height: HEIGHT - PAD.bottom,
    paddingHorizontal: PAD.left,
    position: 'relative',
  },
  skeletonLine: {
    position: 'absolute',
    left: PAD.left,
    right: PAD.right,
    height: 2,
    borderRadius: 1,
  },
  empty: {
    ...typography.body,
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.text2,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text3,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
