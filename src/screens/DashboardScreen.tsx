import React, { useCallback, useMemo } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';
import { MarketsStackParamList } from '../types/navigation';
import { Header } from '../components/Header';
import { SymbolCard } from '../components/SymbolCard';
import { WhatChangedStrip } from '../components/WhatChangedStrip';
import { SourceAttribution } from '../components/SourceAttribution';
import { EducationalTooltip } from '../components/EducationalTooltip';
import { useAllForecasts } from '../hooks/useAllForecasts';
import { useAllForecastHistories } from '../hooks/useAllForecastHistories';
import { useSpotPrices } from '../hooks/useSpotPrices';
import { computeTrend, computeConfidence } from '../utils/marketAnalytics';
import { CryptoForecast } from '../types/market';
import { ForecastPoint } from '../services/forecastHistory';

type Props = NativeStackScreenProps<MarketsStackParamList, 'Dashboard'>;

function buildHeadline(
  forecasts: CryptoForecast[],
  histories: (ForecastPoint[] | undefined)[],
): { title: string; subtitle: string } {
  const parts = forecasts
    .map((f, i) => {
      const eoy = f.forecasts.find((s) => s.type === 'eoy');
      const best = eoy?.mostLikelyBracket;
      const history = histories[i];
      const trend = history ? computeTrend(history) : null;
      const confidence = eoy ? computeConfidence(eoy.brackets) : 0;
      return { symbol: f.symbol, best, trend, confidence };
    })
    .filter((p) => p.best);

  if (parts.length === 0) {
    return {
      title: 'Markets are warming up',
      subtitle: 'Market consensus will land shortly.',
    };
  }

  const biggestMover = parts
    .filter((p) => p.trend && Math.abs(p.trend.changePercent) >= 3)
    .sort((a, b) => Math.abs(b.trend!.changePercent) - Math.abs(a.trend!.changePercent))[0];

  if (biggestMover) {
    const dir = biggestMover.trend!.changePercent > 0 ? 'rising' : 'slipping';
    return {
      title: `${biggestMover.symbol} is ${dir} this week`,
      subtitle: `${Math.abs(biggestMover.trend!.changePercent).toFixed(1)}% shift in the year-end consensus.`,
    };
  }

  const mostConvinced = [...parts].sort((a, b) => b.confidence - a.confidence)[0];
  if (mostConvinced.confidence >= 40) {
    return {
      title: `Tight consensus on ${mostConvinced.symbol}`,
      subtitle: `${mostConvinced.best!.probability}% on ${mostConvinced.best!.displayRange} by year-end.`,
    };
  }

  return {
    title: 'Markets are split',
    subtitle: 'No single range dominates — watch the full distribution below.',
  };
}

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const allForecasts = useAllForecasts();
  const forecasts = ALL_CRYPTO_KEYS.map((s) => allForecasts[s]);

  const { data: spotPrices } = useSpotPrices();

  const { histories: historyMap, dataUpdatedAt } = useAllForecastHistories();
  const histories: (ForecastPoint[] | undefined)[] = ALL_CRYPTO_KEYS.map(
    (s) => historyMap[s],
  );

  const headline = useMemo(() => buildHeadline(forecasts, histories), [forecasts, histories]);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['kalshi-markets'] });
    await queryClient.invalidateQueries({ queryKey: ['spot-prices'] });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <Header dataUpdatedAt={dataUpdatedAt} />

        <EducationalTooltip />

        <View style={styles.cards}>
          {forecasts.map((forecast, i) => (
            <SymbolCard
              key={forecast.symbol}
              forecast={forecast}
              history={histories[i] ?? undefined}
              spotPrice={spotPrices?.[forecast.symbol] ?? null}
              onPress={() =>
                navigation.navigate('CryptoDetail', { symbol: forecast.symbol })
              }
            />
          ))}
        </View>

        <WhatChangedStrip />

        <SourceAttribution />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  cards: {
    marginBottom: spacing.md,
  },
});
