import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { confidenceColor, confidenceLabel } from '../theme/semantics';
import { TOKENS } from '../constants/tokens';
import { CryptoForecast } from '../types/market';
import { computeConfidence, computeTrend } from '../utils/marketAnalytics';
import { ForecastPoint } from '../services/forecastHistory';
import { DistributionCurve } from './DistributionCurve';

interface Props {
  forecast: CryptoForecast;
  history?: ForecastPoint[];
  spotPrice?: number | null;
  onPress: () => void;
}

function formatPrice(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

export function SymbolCard({ forecast, history, spotPrice, onPress }: Props) {
  const [width, setWidth] = useState(320);
  const token = TOKENS[forecast.symbol];
  const eoy = forecast.forecasts.find((f) => f.type === 'eoy');
  const best = eoy?.mostLikelyBracket;
  const brandColor = token?.color ?? colors.accent;

  const confidence = useMemo(
    () => (eoy ? computeConfidence(eoy.brackets) : 0),
    [eoy],
  );
  const trend = useMemo(() => (history ? computeTrend(history) : null), [history]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (forecast.isLoading) {
    return (
      <View style={[styles.card, styles.cardMuted]}>
        <Header symbol={forecast.symbol} brandColor={brandColor} glyph={token?.icon ?? '?'} name={token?.name ?? ''} />
        <Text style={styles.placeholder}>Loading…</Text>
      </View>
    );
  }

  if (forecast.isError || !eoy || !best) {
    return (
      <View style={[styles.card, styles.cardMuted]}>
        <Header symbol={forecast.symbol} brandColor={brandColor} glyph={token?.icon ?? '?'} name={token?.name ?? ''} />
        <Text style={styles.placeholder}>Forecast unavailable</Text>
      </View>
    );
  }

  const trendColor =
    trend?.direction === 'up'
      ? colors.up
      : trend?.direction === 'down'
        ? colors.down
        : colors.text3;
  const trendArrow = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';
  const confColor = confidenceColor(confidence);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} onLayout={onLayout}>
      <View style={styles.headerRow}>
        <View style={[styles.glyph, { borderColor: brandColor + '66' }]}>
          <Text style={[styles.glyphText, { color: brandColor }]}>{token?.icon ?? '?'}</Text>
        </View>
        <View style={styles.headerMid}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>{forecast.symbol}</Text>
            <Text style={styles.name}>{token?.name ?? forecast.symbol}</Text>
          </View>
          <Text style={styles.spotLine}>
            <Text style={styles.spotLabel}>now </Text>
            <Text style={styles.spotValue}>{formatPrice(spotPrice)}</Text>
            <Text style={styles.spotLabel}>  →  by EOY  </Text>
            <Text style={[styles.forecastValue, { color: brandColor }]}>
              {formatPrice(eoy.expectedValue)}
            </Text>
          </Text>
        </View>
        {trend && (
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendArrow} {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
          </Text>
        )}
      </View>

      <View style={styles.curveWrap}>
        <DistributionCurve
          brackets={eoy.brackets}
          accentColor={brandColor}
          spotPrice={spotPrice ?? null}
          height={104}
          width={width - spacing.lg * 2}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Most likely</Text>
          <Text style={styles.footerValue}>{best.displayRange}</Text>
        </View>
        <View style={styles.footerSep} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Probability</Text>
          <Text style={[styles.footerValue, { color: brandColor }]}>{best.probability}%</Text>
        </View>
        <View style={styles.footerSep} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Confidence</Text>
          <View style={styles.confRow}>
            <View style={[styles.confDot, { backgroundColor: confColor }]} />
            <Text style={[styles.footerValue, { color: confColor }]}>{confidenceLabel(confidence)}</Text>
          </View>
        </View>
        <Icon source="chevron-right" size={18} color={colors.text3} />
      </View>
    </TouchableOpacity>
  );
}

function Header({ brandColor, glyph }: { symbol: string; brandColor: string; glyph: string; name: string }) {
  return (
    <View style={styles.headerRow}>
      <View style={[styles.glyph, { borderColor: brandColor + '66' }]}>
        <Text style={[styles.glyphText, { color: brandColor }]}>{glyph}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardMuted: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  glyph: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphText: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  headerMid: {
    flex: 1,
    gap: 2,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  symbol: {
    ...typography.title,
    fontSize: 18,
    color: colors.text1,
  },
  name: {
    ...typography.caption,
    color: colors.text3,
  },
  spotLine: {
    ...typography.body,
    fontSize: 12,
    color: colors.text2,
  },
  spotLabel: {
    color: colors.text3,
  },
  spotValue: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text1,
    ...typography.numeric,
  },
  forecastValue: {
    ...typography.bodyStrong,
    fontSize: 13,
    ...typography.numeric,
  },
  trend: {
    ...typography.captionStrong,
    fontSize: 12,
    ...typography.numeric,
  },
  curveWrap: {
    marginTop: -spacing.xs,
    marginBottom: -spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flex: 1,
    gap: 2,
  },
  footerLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerValue: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text1,
    ...typography.numeric,
  },
  footerSep: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  confRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  placeholder: {
    ...typography.body,
    color: colors.text3,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
