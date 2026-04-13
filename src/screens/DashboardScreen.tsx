import React, { useCallback, useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { CRYPTO_TICKERS } from '../constants/kalshi';
import { RootStackParamList } from '../types/navigation';
import { Header } from '../components/Header';
import { CryptoCard } from '../components/CryptoCard';
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { ComparisonView } from '../components/ComparisonView';
import { SourceAttribution } from '../components/SourceAttribution';
import { EducationalTooltip } from '../components/EducationalTooltip';
import { useForecast } from '../hooks/useForecast';
import { useForecastHistory } from '../hooks/useForecastHistory';
import { useSpotPrices } from '../hooks/useSpotPrices';
import { computeTrend } from '../utils/marketAnalytics';
import { TouchableOpacity } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function DashboardContent({ navigation }: Props) {
  const btcForecast = useForecast('BTC');
  const ethForecast = useForecast('ETH');
  const solForecast = useForecast('SOL');
  const forecasts = [btcForecast, ethForecast, solForecast];

  const { data: spotPrices } = useSpotPrices();

  // Fetch EOY history for trend arrows
  const btcEoyTicker = CRYPTO_TICKERS.BTC?.find((t) => t.type === 'eoy')?.seriesTicker;
  const ethEoyTicker = CRYPTO_TICKERS.ETH?.find((t) => t.type === 'eoy')?.seriesTicker;
  const solEoyTicker = CRYPTO_TICKERS.SOL?.find((t) => t.type === 'eoy')?.seriesTicker;

  const { data: btcHistory, dataUpdatedAt: btcUpdatedAt } = useForecastHistory(btcEoyTicker);
  const { data: ethHistory } = useForecastHistory(ethEoyTicker);
  const { data: solHistory } = useForecastHistory(solEoyTicker);

  const btcTrend = useMemo(() => btcHistory ? computeTrend(btcHistory) : null, [btcHistory]);
  const ethTrend = useMemo(() => ethHistory ? computeTrend(ethHistory) : null, [ethHistory]);
  const solTrend = useMemo(() => solHistory ? computeTrend(solHistory) : null, [solHistory]);
  const trends = [btcTrend, ethTrend, solTrend];

  const [showComparison, setShowComparison] = useState(false);

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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        <Header />

        {/* Data freshness indicator */}
        {btcUpdatedAt > 0 && (
          <View style={styles.freshnessRow}>
            <DataFreshnessIndicator dataUpdatedAt={btcUpdatedAt} />
          </View>
        )}

        {/* Comparison toggle */}
        <View style={styles.compareRow}>
          <TouchableOpacity
            style={[styles.compareButton, showComparison && styles.compareButtonActive]}
            onPress={() => setShowComparison(!showComparison)}
            activeOpacity={0.7}
          >
            <Text style={[styles.compareText, showComparison && styles.compareTextActive]}>
              {showComparison ? 'Hide Comparison' : 'Compare All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison table */}
        {showComparison && (
          <View style={styles.comparisonSection}>
            <ComparisonView forecasts={forecasts} spotPrices={spotPrices} />
          </View>
        )}

        {/* Staggered crypto cards */}
        {forecasts.map((forecast, index) => (
          <CryptoCard
            key={forecast.symbol}
            forecast={forecast}
            onPress={() =>
              navigation.navigate('CryptoDetail', { symbol: forecast.symbol })
            }
            trend={trends[index]}
            animationDelay={index * 150}
          />
        ))}

        {/* Source attribution */}
        <SourceAttribution />

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Not financial advice. Data from Kalshi prediction markets for
            informational purposes only.
          </Text>
        </View>
      </ScrollView>

      {/* Educational tooltip overlay */}
      <EducationalTooltip />
    </View>
  );
}

export function DashboardScreen(props: Props) {
  return <DashboardContent {...props} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  freshnessRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  compareButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
  },
  compareButtonActive: {
    backgroundColor: Colors.accentDim,
  },
  compareText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  compareTextActive: {
    color: Colors.accent,
  },
  comparisonSection: {
    marginBottom: 16,
  },
  disclaimerContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});
