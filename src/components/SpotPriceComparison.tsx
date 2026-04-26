import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { directionColor } from '../theme/semantics';

interface SpotPriceComparisonProps {
  spotPrice: number | null;
  expectedValue: number | null;
  accentColor: string;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function SpotPriceComparison({
  spotPrice,
  expectedValue,
  accentColor,
}: SpotPriceComparisonProps) {
  if (spotPrice == null || expectedValue == null || expectedValue === 0) {
    return null;
  }

  const delta = spotPrice - expectedValue;
  const deltaPercent = (delta / expectedValue) * 100;
  const isAbove = delta > 0;
  const deltaColor = directionColor(delta);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.priceBlock}>
          <Text style={styles.label}>Current Price</Text>
          <Text style={[styles.price, { color: accentColor }]}>
            {formatPrice(spotPrice)}
          </Text>
        </View>
        <View style={styles.deltaBlock}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {isAbove ? '+' : ''}{deltaPercent.toFixed(1)}%
          </Text>
          <Text style={styles.deltaLabel}>vs forecast</Text>
        </View>
        <View style={[styles.priceBlock, styles.rightAlign]}>
          <Text style={styles.label}>EOY Forecast</Text>
          <Text style={styles.forecastPrice}>{formatPrice(expectedValue)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBlock: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.display,
    ...typography.numeric,
    fontSize: 22,
  },
  forecastPrice: {
    ...typography.display,
    ...typography.numeric,
    fontSize: 22,
    color: colors.text1,
  },
  deltaBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  deltaText: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    ...typography.numeric,
  },
  deltaLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
  },
});
