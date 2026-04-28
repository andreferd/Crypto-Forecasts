import React, { useCallback, useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radii, typography } from '../theme';
import { confidenceColor, confidenceLabel } from '../theme/semantics';
import { TOKENS } from '../constants/tokens';
import { RootTabParamList } from '../types/navigation';
import { CRYPTO_TICKERS, ForecastType } from '../constants/kalshi';
import { RootStackParamList } from '../types/navigation';
import { ForecastLineChart } from '../components/ForecastLineChart';
import { DistributionCurve } from '../components/DistributionCurve';
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { TimePeriodSelector, TimePeriod, periodToDays } from '../components/TimePeriodSelector';
import { SourceAttribution } from '../components/SourceAttribution';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForecast } from '../hooks/useForecast';
import { useForecastHistory } from '../hooks/useForecastHistory';
import { useSpotPrices } from '../hooks/useSpotPrices';
import { computeTrend, computeConfidence } from '../utils/marketAnalytics';

type Props = NativeStackScreenProps<RootStackParamList, 'CryptoDetail'>;

const TYPE_LABELS: Record<ForecastType, { pill: string; arrow: string }> = {
  eoy: { pill: 'EoY', arrow: 'by EoY' },
  max: { pill: 'High', arrow: 'yearly high' },
  min: { pill: 'Low', arrow: 'yearly low' },
  maxmon: { pill: 'High', arrow: 'monthly high' },
  minmon: { pill: 'Low', arrow: 'monthly low' },
};

function formatPrice(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

export function CryptoDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { symbol } = route.params;
  const token = TOKENS[symbol];
  const brandColor = token?.color ?? colors.accent;
  const { forecasts, isLoading, isError } = useForecast(symbol);
  const { data: spotPrices } = useSpotPrices();
  const spotPrice = spotPrices?.[symbol as keyof typeof spotPrices] ?? null;

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
  const daysBack = periodToDays(timePeriod);

  const tickers = CRYPTO_TICKERS[symbol] ?? [];
  const eoyTicker = tickers.find((t) => t.type === 'eoy')?.seriesTicker;
  const { data: forecastHistory, dataUpdatedAt } = useForecastHistory(eoyTicker, daysBack);

  const trend = useMemo(
    () => (forecastHistory ? computeTrend(forecastHistory) : null),
    [forecastHistory],
  );

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kalshi-markets'] }),
      queryClient.invalidateQueries({ queryKey: ['forecast-history'] }),
      queryClient.invalidateQueries({ queryKey: ['spot-prices'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const availableTypes = useMemo<ForecastType[]>(() => {
    const present = new Set(forecasts.map((f) => f.type));
    return (['eoy', 'max', 'min'] as ForecastType[]).filter((t) => present.has(t));
  }, [forecasts]);

  const [selectedType, setSelectedType] = useState<ForecastType>('eoy');
  const active =
    forecasts.find((f) => f.type === selectedType) ??
    forecasts.find((f) => f.type === 'eoy');
  const best = active?.mostLikelyBracket;

  const confidence = useMemo(
    () => (active ? computeConfidence(active.brackets) : 0),
    [active],
  );

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 80 + insets.bottom }]}
      >
        <View style={styles.section}>
          <View style={[styles.skelLine, { width: '60%' }]} />
          <View style={[styles.skelLine, styles.skelLineTall]} />
          <View style={[styles.skelLine, { width: '40%' }]} />
        </View>
        <View style={styles.section}>
          <View style={[styles.skelLine, { width: '45%' }]} />
          <View style={[styles.skelLine, styles.skelLineTall]} />
        </View>
      </ScrollView>
    );
  }

  if (isError || !active) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Unable to load consensus data for {symbol}</Text>
      </View>
    );
  }

  const labels = TYPE_LABELS[selectedType];
  const trendColor =
    trend?.direction === 'up'
      ? colors.up
      : trend?.direction === 'down'
        ? colors.down
        : colors.text3;
  const trendArrow = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';
  const confColor = confidenceColor(confidence);
  const cardWidth = screenWidth - spacing.lg * 4;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 80 + insets.bottom }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Snapshot section */}
      <View style={styles.section}>
        <View style={styles.snapshotHeader}>
          <Text style={styles.spotLine}>
            <Text style={styles.spotLabel}>now </Text>
            <Text style={styles.spotValue}>{formatPrice(spotPrice)}</Text>
            <Text style={styles.spotLabel}>  →  {labels.arrow}  </Text>
            <Text style={[styles.forecastValue, { color: brandColor }]}>
              {formatPrice(active.expectedValue)}
            </Text>
          </Text>
          {trend && (
            <Text style={[styles.trend, { color: trendColor }]}>
              {trendArrow} {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </Text>
          )}
        </View>

        {availableTypes.length > 1 && (
          <View style={styles.pillRow}>
            <View style={styles.pillGroup}>
              {availableTypes.map((t) => {
                const isActive = t === selectedType;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSelectedType(t)}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.pill,
                      isActive && {
                        borderColor: brandColor + '88',
                        backgroundColor: brandColor + '14',
                      },
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
            <View style={styles.confChip}>
              <View style={[styles.confDot, { backgroundColor: confColor }]} />
              <Text style={[styles.confText, { color: confColor }]}>
                {confidenceLabel(confidence)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.curveWrap}>
          <DistributionCurve
            brackets={active.brackets}
            accentColor={brandColor}
            spotPrice={selectedType === 'eoy' ? spotPrice : null}
            height={180}
            width={cardWidth}
          />
        </View>

        {best && (
          <Text style={styles.summaryLine}>
            <Text style={[styles.summaryEm, { color: brandColor }]}>{best.probability}%</Text>
            <Text style={styles.summaryLabel}>  chance of  </Text>
            <Text style={styles.summaryEm}>{best.displayRange}</Text>
          </Text>
        )}
      </View>

      {/* History section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consensus history</Text>
          {dataUpdatedAt > 0 && <DataFreshnessIndicator dataUpdatedAt={dataUpdatedAt} />}
        </View>
        <View style={styles.timePeriodRow}>
          <TimePeriodSelector selected={timePeriod} onSelect={setTimePeriod} />
        </View>
        <ForecastLineChart
          data={forecastHistory ?? []}
          accentColor={brandColor}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.predictButton,
          { backgroundColor: brandColor },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => {
          const tabNav = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
          tabNav?.navigate('Predict');
        }}
      >
        <Icon source="approximately-equal-box" size={18} color={colors.onAccent} />
        <Text style={styles.predictButtonText}>Make a call on {symbol}</Text>
      </Pressable>

      <SourceAttribution />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text3,
  },
  skelLine: {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    width: '70%',
  },
  skelLineTall: {
    height: 120,
    width: '100%',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotLine: {
    flex: 1,
    ...typography.body,
    color: colors.text2,
  },
  spotLabel: {
    color: colors.text3,
  },
  spotValue: {
    ...typography.bodyStrong,
    color: colors.text1,
    ...typography.numeric,
  },
  forecastValue: {
    ...typography.bodyStrong,
    ...typography.numeric,
  },
  trend: {
    ...typography.bodySmStrong,
    ...typography.numeric,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  confChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confText: {
    ...typography.microStrong,
    fontFamily: typography.caption.fontFamily,
  },
  curveWrap: {
    alignItems: 'center',
  },
  summaryLine: {
    ...typography.body,
    color: colors.text2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    color: colors.text3,
  },
  summaryEm: {
    ...typography.bodyStrong,
    color: colors.text1,
    ...typography.numeric,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.bodyLg,
    fontFamily: typography.title.fontFamily,
    color: colors.text1,
  },
  timePeriodRow: {
    marginTop: -spacing.xs,
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  predictButtonText: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.onAccent,
  },
});
