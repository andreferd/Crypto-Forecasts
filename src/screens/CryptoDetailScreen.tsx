import React, { useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { RootTabParamList } from '../types/navigation';
import { CRYPTO_TICKERS, ForecastType } from '../constants/kalshi';
import { RootStackParamList } from '../types/navigation';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { ForecastLineChart } from '../components/ForecastLineChart';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ShareButton } from '../components/ShareButton';
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { SpotPriceComparison } from '../components/SpotPriceComparison';
import { TimePeriodSelector, TimePeriod, periodToDays } from '../components/TimePeriodSelector';
import { MarketSummaryCard } from '../components/MarketSummaryCard';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { ScenarioExplorer } from '../components/ScenarioExplorer';
import { TrendArrow } from '../components/TrendArrow';
import { SourceAttribution } from '../components/SourceAttribution';
import { SegmentedControl, SegmentOption } from '../components/SegmentedControl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForecast } from '../hooks/useForecast';
import { useForecastHistory } from '../hooks/useForecastHistory';
import { useSpotPrices } from '../hooks/useSpotPrices';
import { computeTrend } from '../utils/marketAnalytics';

type Props = NativeStackScreenProps<RootStackParamList, 'CryptoDetail'>;

const SERIES_LABELS: Record<ForecastType, { short: string; long: string }> = {
  eoy: { short: 'EOY', long: 'End of year' },
  max: { short: 'High', long: 'Yearly high' },
  min: { short: 'Low', long: 'Yearly low' },
};

function formatExpectedValue(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export function CryptoDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { symbol } = route.params;
  const token = TOKENS[symbol];
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

  const eoySeries = forecasts.find((f) => f.type === 'eoy');

  // Segmented control: only show types the symbol actually has
  const segmentOptions: SegmentOption<ForecastType>[] = useMemo(
    () =>
      forecasts.map((s) => ({
        value: s.type,
        label: SERIES_LABELS[s.type].short,
        sublabel: formatExpectedValue(s.expectedValue),
      })),
    [forecasts],
  );
  const [selectedType, setSelectedType] = useState<ForecastType>('eoy');
  const selectedSeries = forecasts.find((f) => f.type === selectedType) ?? eoySeries;

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </ScrollView>
    );
  }

  if (isError || forecasts.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Unable to load forecast data for {symbol}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 80 + insets.bottom }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? colors.accent }]}>
          <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{token?.name ?? symbol}</Text>
        </View>
        <ShareButton
          symbol={symbol}
          name={token?.name ?? symbol}
          forecasts={forecasts}
          spotPrice={spotPrice}
        />
      </View>

      {dataUpdatedAt > 0 && (
        <View style={styles.freshnessRow}>
          <DataFreshnessIndicator dataUpdatedAt={dataUpdatedAt} />
        </View>
      )}

      {eoySeries && (
        <View style={styles.sectionGap}>
          <SpotPriceComparison
            spotPrice={spotPrice}
            expectedValue={eoySeries.expectedValue}
            accentColor={token?.color ?? colors.accent}
          />
        </View>
      )}

      {/* Forecast line chart (EOY only) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Forecast history</Text>
            <Text style={styles.sectionSubtitle}>End-of-year consensus over time</Text>
          </View>
          {trend && (
            <TrendArrow direction={trend.direction} changePercent={trend.changePercent} />
          )}
        </View>
        <View style={styles.timePeriodRow}>
          <TimePeriodSelector selected={timePeriod} onSelect={setTimePeriod} />
        </View>
        <ForecastLineChart
          data={forecastHistory ?? []}
          accentColor={token?.color ?? colors.accent}
        />
      </View>

      {/* Confidence + summary (EOY only) */}
      {eoySeries && (
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MarketSummaryCard
                symbol={symbol}
                brackets={eoySeries.brackets}
                spotPrice={spotPrice}
              />
            </View>
            <View style={styles.summaryRight}>
              <ConfidenceMeter brackets={eoySeries.brackets} />
            </View>
          </View>
        </View>
      )}

      {/* Distributions — segmented across available series */}
      {selectedSeries && segmentOptions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Distribution</Text>
            <Text style={styles.expectedValue}>
              {SERIES_LABELS[selectedSeries.type].long}
            </Text>
          </View>

          {segmentOptions.length > 1 && (
            <View style={styles.segmentRow}>
              <SegmentedControl
                options={segmentOptions}
                value={selectedType}
                onChange={setSelectedType}
              />
            </View>
          )}

          {selectedSeries.mostLikelyBracket && (
            <View style={styles.headline}>
              <Text style={styles.headlineLabel}>Most likely</Text>
              <View style={styles.headlineValue}>
                <Text style={styles.headlineRange}>
                  {selectedSeries.mostLikelyBracket.displayRange}
                </Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: (token?.color ?? colors.accent) + '33' },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: token?.color ?? colors.accent }]}>
                    {selectedSeries.mostLikelyBracket.probability}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          <ProbabilityChart
            brackets={selectedSeries.brackets}
            accentColor={token?.color ?? colors.accent}
          />
        </View>
      )}

      {eoySeries && eoySeries.brackets.length > 0 && (
        <ScenarioExplorer
          brackets={eoySeries.brackets}
          accentColor={token?.color ?? colors.accent}
        />
      )}

      <TouchableOpacity
        style={styles.predictButton}
        onPress={() => {
          const tabNav = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
          tabNav?.navigate('Predict');
        }}
      >
        <Icon source="approximately-equal-box" size={20} color={colors.onAccent} />
        <Text style={styles.predictButtonText}>Make a call on {symbol}</Text>
      </TouchableOpacity>

      <SourceAttribution />

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This app displays data from Kalshi prediction markets for informational
          purposes only. This is not financial advice, investment recommendation,
          or solicitation to trade. Prediction market prices reflect market
          participants' opinions and are not guaranteed forecasts. Always do your
          own research before making investment decisions. Past performance does
          not guarantee future results.
        </Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    ...typography.display,
    color: colors.text1,
  },
  headerInfo: {
    flex: 1,
  },
  symbol: {
    ...typography.hero,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text1,
  },
  name: {
    ...typography.body,
    color: colors.text2,
  },
  freshnessRow: {
    marginBottom: spacing.md,
  },
  sectionGap: {
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyLg,
    fontFamily: typography.title.fontFamily,
    color: colors.text1,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text2,
    marginTop: 2,
  },
  timePeriodRow: {
    marginBottom: spacing.md,
  },
  segmentRow: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryRight: {
    width: 130,
    alignItems: 'center',
  },
  expectedValue: {
    ...typography.caption,
    color: colors.text2,
  },
  headline: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headlineLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  headlineValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headlineRange: {
    ...typography.title,
    fontSize: 18,
    color: colors.text1,
  },
  badge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.bodyStrong,
  },
  errorText: {
    ...typography.body,
    color: colors.text3,
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  predictButtonText: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.onAccent,
  },
  disclaimer: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disclaimerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text3,
    lineHeight: 16,
  },
});
