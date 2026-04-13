import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { PriceBracket } from '../types/market';
import { generateMarketSummary } from '../utils/marketAnalytics';

interface MarketSummaryCardProps {
  symbol: string;
  brackets: PriceBracket[];
  spotPrice?: number | null;
}

export function MarketSummaryCard({ symbol, brackets, spotPrice }: MarketSummaryCardProps) {
  const summary = useMemo(
    () => generateMarketSummary(symbol, brackets, spotPrice),
    [symbol, brackets, spotPrice],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{'📊'}</Text>
      <Text style={styles.text}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    marginTop: 1,
  },
  text: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    flex: 1,
  },
});
