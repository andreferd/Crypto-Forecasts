import React, { useCallback } from 'react';
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
import { ForecastPoint } from '../services/forecastHistory';

type Props = NativeStackScreenProps<MarketsStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const allForecasts = useAllForecasts();
  const forecasts = ALL_CRYPTO_KEYS.map((s) => allForecasts[s]);

  const { data: spotPrices } = useSpotPrices();

  const { histories: historyMap, dataUpdatedAt } = useAllForecastHistories();
  const histories: (ForecastPoint[] | undefined)[] = ALL_CRYPTO_KEYS.map(
    (s) => historyMap[s],
  );

  // Stable handler so React.memo'd SymbolCards don't re-render on every tick.
  const handlePressSymbol = useCallback(
    (symbol: string) => navigation.navigate('CryptoDetail', { symbol }),
    [navigation],
  );

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
              onPress={handlePressSymbol}
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
