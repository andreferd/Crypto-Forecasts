import React, { useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { RootTabParamList } from '../types/navigation';
import { CRYPTO_TICKERS } from '../constants/kalshi';
import { getCatalystsForSymbol } from '../constants/catalysts';
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
import { useForecast } from '../hooks/useForecast';
import { useForecastHistory } from '../hooks/useForecastHistory';
import { useSpotPrices } from '../hooks/useSpotPrices';
import { computeTrend } from '../utils/marketAnalytics';

type Props = NativeStackScreenProps<RootStackParamList, 'CryptoDetail'>;

function formatExpectedValue(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export function CryptoDetailScreen({ route, navigation }: Props) {
  const { symbol } = route.params;
  const token = TOKENS[symbol];
  const { forecasts, isLoading, isError } = useForecast(symbol);
  const { data: spotPrices } = useSpotPrices();
  const spotPrice = spotPrices?.[symbol as keyof typeof spotPrices] ?? null;

  // Time period for chart
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
  const daysBack = periodToDays(timePeriod);

  // Forecast history
  const tickers = CRYPTO_TICKERS[symbol] ?? [];
  const eoyTicker = tickers.find((t) => t.type === 'eoy')?.seriesTicker;
  const { data: forecastHistory, dataUpdatedAt } = useForecastHistory(eoyTicker, daysBack);

  // Catalysts for this symbol
  const catalysts = useMemo(() => getCatalystsForSymbol(symbol), [symbol]);

  // Trend calculation
  const trend = useMemo(
    () => (forecastHistory ? computeTrend(forecastHistory) : null),
    [forecastHistory],
  );

  // EOY series for summary/confidence/scenario
  const eoySeries = forecasts.find((f) => f.type === 'eoy');

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with icon + name + share */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
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

      {/* Data freshness */}
      {dataUpdatedAt > 0 && (
        <View style={styles.freshnessRow}>
          <DataFreshnessIndicator dataUpdatedAt={dataUpdatedAt} />
        </View>
      )}

      {/* Spot price comparison */}
      {eoySeries && (
        <View style={styles.sectionGap}>
          <SpotPriceComparison
            spotPrice={spotPrice}
            expectedValue={eoySeries.expectedValue}
            accentColor={token?.color ?? Colors.accent}
          />
        </View>
      )}

      {/* Forecast line chart with time period selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{symbol} Price Forecast</Text>
            <Text style={styles.sectionSubtitle}>End of year prediction market data</Text>
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
          accentColor={token?.color ?? Colors.accent}
          catalysts={catalysts}
        />
      </View>

      {/* Market summary + Confidence meter */}
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

      {/* Forecast sections with probability bars */}
      {forecasts.map((series) => (
        <View key={series.type} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{series.label}</Text>
            {series.expectedValue != null && (
              <Text style={styles.expectedValue}>
                Expected: {formatExpectedValue(series.expectedValue)}
              </Text>
            )}
          </View>

          {series.mostLikelyBracket && (
            <View style={styles.headline}>
              <Text style={styles.headlineLabel}>Most likely</Text>
              <View style={styles.headlineValue}>
                <Text style={styles.headlineRange}>
                  {series.mostLikelyBracket.displayRange}
                </Text>
                <View style={[styles.badge, { backgroundColor: (token?.color ?? Colors.accent) + '33' }]}>
                  <Text style={[styles.badgeText, { color: token?.color ?? Colors.accent }]}>
                    {series.mostLikelyBracket.probability}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          <ProbabilityChart
            brackets={series.brackets}
            accentColor={token?.color ?? Colors.chartBar}
          />
        </View>
      ))}

      {/* Scenario Explorer (EOY only) */}
      {eoySeries && eoySeries.brackets.length > 0 && (
        <ScenarioExplorer
          brackets={eoySeries.brackets}
          accentColor={token?.color ?? Colors.accent}
        />
      )}

      {/* Make a Prediction */}
      <TouchableOpacity
        style={styles.predictButton}
        onPress={() => {
          const tabNav = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
          tabNav?.navigate('Predict');
        }}
      >
        <Icon source="crystal-ball" size={20} color="#fff" />
        <Text style={styles.predictButtonText}>Make a Prediction</Text>
      </TouchableOpacity>

      {/* Source attribution */}
      <SourceAttribution />

      {/* Disclaimer */}
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  name: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  freshnessRow: {
    marginBottom: 12,
  },
  sectionGap: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timePeriodRow: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headline: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  headlineLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headlineValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headlineRange: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accentDim,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
