import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

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
  const deltaColor = isAbove ? Colors.success : Colors.error;

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
          <Text style={styles.deltaLabel}>
            vs forecast
          </Text>
        </View>
        <View style={[styles.priceBlock, styles.rightAlign]}>
          <Text style={styles.label}>EOY Forecast</Text>
          <Text style={styles.forecastPrice}>
            {formatPrice(expectedValue)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  forecastPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  deltaBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  deltaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deltaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
