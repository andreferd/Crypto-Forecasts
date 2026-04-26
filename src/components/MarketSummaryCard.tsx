import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
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
      <Icon source="chart-bell-curve" size={18} color={colors.accent} />
      <Text style={styles.text}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  text: {
    ...typography.body,
    fontSize: 13,
    color: colors.text1,
    flex: 1,
  },
});
