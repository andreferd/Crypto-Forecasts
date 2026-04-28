import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, LayoutChangeEvent } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { confidenceColor, confidenceLabel } from '../theme/semantics';
import { TOKENS } from '../constants/tokens';
import { ForecastType } from '../constants/kalshi';
import { CryptoForecast } from '../types/market';
import { computeConfidence, computeTrend } from '../utils/marketAnalytics';
import { ForecastPoint } from '../services/forecastHistory';
import { DistributionCurve } from './DistributionCurve';

const TYPE_LABELS: Record<ForecastType, { pill: string; arrow: string }> = {
  eoy: { pill: 'EoY', arrow: 'by EoY' },
  max: { pill: 'High', arrow: 'yearly high' },
  min: { pill: 'Low', arrow: 'yearly low' },
  maxmon: { pill: 'High', arrow: 'monthly high' },
  minmon: { pill: 'Low', arrow: 'monthly low' },
};

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
  if (v >= 1) return `$${Math.round(v)}`;
  if (v >= 0.01) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

export function SymbolCard({ forecast, history, spotPrice, onPress }: Props) {
  const [width, setWidth] = useState(320);
  const [selectedType, setSelectedType] = useState<ForecastType>('eoy');
  const [userPicked, setUserPicked] = useState(false);
  const token = TOKENS[forecast.symbol];
  const brandColor = token?.color ?? colors.accent;

  // Available types in a stable display order
  const availableTypes = useMemo<ForecastType[]>(() => {
    const present = new Set(forecast.forecasts.map((f) => f.type));
    return (['eoy', 'max', 'min', 'maxmon', 'minmon'] as ForecastType[]).filter((t) =>
      present.has(t),
    );
  }, [forecast.forecasts]);

  // Until the user clicks a pill, always prefer 'eoy' if it's available; this
  // avoids getting stuck on whichever series happened to load first when the
  // EOY query is still pending.
  useEffect(() => {
    if (userPicked) return;
    if (availableTypes.length === 0) return;
    const preferred: ForecastType = availableTypes.includes('eoy')
      ? 'eoy'
      : availableTypes[0];
    if (preferred !== selectedType) setSelectedType(preferred);
  }, [availableTypes, selectedType, userPicked]);

  const handlePickType = (t: ForecastType) => {
    setUserPicked(true);
    setSelectedType(t);
  };

  const active =
    forecast.forecasts.find((f) => f.type === selectedType) ??
    forecast.forecasts.find((f) => f.type === availableTypes[0]);
  const best = active?.mostLikelyBracket;

  const confidence = useMemo(
    () => (active ? computeConfidence(active.brackets) : 0),
    [active],
  );
  const trend = useMemo(() => (history ? computeTrend(history) : null), [history]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (forecast.isLoading) {
    return (
      <View style={styles.card}>
        <PlaceholderHeader
          symbol={forecast.symbol}
          brandColor={brandColor}
          glyph={token?.icon ?? '?'}
          name={token?.name ?? forecast.symbol}
        />
        <View style={styles.skeletonBlock} />
        <View style={[styles.skeletonBlock, styles.skeletonBlockTall]} />
      </View>
    );
  }

  if (forecast.isError || !active || !best) {
    return (
      <View style={styles.card}>
        <PlaceholderHeader
          symbol={forecast.symbol}
          brandColor={brandColor}
          glyph={token?.icon ?? '?'}
          name={token?.name ?? forecast.symbol}
        />
        <Text style={styles.placeholder}>Consensus unavailable</Text>
      </View>
    );
  }

  const labels = TYPE_LABELS[active.type];

  const trendColor =
    trend?.direction === 'up'
      ? colors.up
      : trend?.direction === 'down'
        ? colors.down
        : colors.text3;
  const trendArrow = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';
  const confColor = confidenceColor(confidence);

  return (
    <View style={styles.card} onLayout={onLayout}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.zone, pressed && { opacity: 0.85 }]}
      >
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
              <Text style={styles.spotLabel}>  →  {labels.arrow}  </Text>
              <Text style={[styles.forecastValue, { color: brandColor }]}>
                {formatPrice(active.expectedValue)}
              </Text>
            </Text>
          </View>
          {trend && (
            <Text style={[styles.trend, { color: trendColor }]}>
              {trendArrow} {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </Text>
          )}
        </View>
      </Pressable>

      <View style={styles.pillRow}>
        {availableTypes.length > 1 ? (
          <View style={styles.pillGroup}>
            {availableTypes.map((t) => {
              const isActive = t === selectedType;
              return (
                <Pressable
                  key={t}
                  onPress={() => handlePickType(t)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.pill,
                    isActive && { borderColor: brandColor + '88', backgroundColor: brandColor + '14' },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={[styles.pillText, isActive && { color: brandColor }]}>
                    {TYPE_LABELS[t].pill}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : <View />}
        <View style={styles.confChip}>
          <View style={[styles.confDot, { backgroundColor: confColor }]} />
          <Text style={[styles.confText, { color: confColor }]}>{confidenceLabel(confidence)}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.zone, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.curveWrap}>
          <DistributionCurve
            brackets={active.brackets}
            accentColor={brandColor}
            spotPrice={active.type === 'eoy' ? (spotPrice ?? null) : null}
            height={104}
            width={width - spacing.lg * 2}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerLine}>
            <Text style={[styles.footerEm, { color: brandColor }]}>{best.probability}%</Text>
            <Text style={styles.footerLabel}>  chance of  </Text>
            <Text style={styles.footerEm}>{best.displayRange}</Text>
          </Text>
          <Icon source="chevron-right" size={18} color={colors.text3} />
        </View>
      </Pressable>
    </View>
  );
}

function PlaceholderHeader({
  symbol,
  brandColor,
  glyph,
  name,
}: {
  symbol: string;
  brandColor: string;
  glyph: string;
  name: string;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={[styles.glyph, { borderColor: brandColor + '66' }]}>
        <Text style={[styles.glyphText, { color: brandColor }]}>{glyph}</Text>
      </View>
      <View style={styles.headerMid}>
        <View style={styles.symbolRow}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
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
  zone: {
    gap: spacing.md,
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
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
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
    ...typography.titleSm,
    color: colors.text1,
  },
  name: {
    ...typography.caption,
    color: colors.text3,
  },
  spotLine: {
    ...typography.caption,
    color: colors.text2,
  },
  spotLabel: {
    color: colors.text3,
  },
  spotValue: {
    ...typography.bodySmStrong,
    color: colors.text1,
    ...typography.numeric,
  },
  forecastValue: {
    ...typography.bodySmStrong,
    ...typography.numeric,
  },
  trend: {
    ...typography.captionStrong,
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
  footerLine: {
    flex: 1,
    ...typography.bodySm,
    color: colors.text2,
  },
  footerLabel: {
    color: colors.text3,
  },
  footerEm: {
    ...typography.bodySmStrong,
    color: colors.text1,
    ...typography.numeric,
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confText: {
    ...typography.microStrong,
    fontFamily: typography.caption.fontFamily,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  pillText: {
    ...typography.microStrong,
    fontFamily: typography.caption.fontFamily,
    color: colors.text2,
  },
  placeholder: {
    ...typography.body,
    color: colors.text3,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  skeletonBlock: {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    width: '70%',
  },
  skeletonBlockTall: {
    height: 96,
    width: '100%',
    marginTop: spacing.xs,
  },
});
