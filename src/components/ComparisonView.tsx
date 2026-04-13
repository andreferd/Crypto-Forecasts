import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { CryptoForecast } from '../types/market';
import { SpotPrices } from '../services/coinGeckoApi';

interface ComparisonViewProps {
  forecasts: CryptoForecast[];
  spotPrices: SpotPrices | undefined;
}

function formatPrice(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function ComparisonView({ forecasts, spotPrices }: ComparisonViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comparison</Text>

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerText, styles.nameCell]}>Asset</Text>
        <Text style={[styles.cell, styles.headerText]}>Spot</Text>
        <Text style={[styles.cell, styles.headerText]}>EOY Forecast</Text>
        <Text style={[styles.cell, styles.headerText]}>Prob.</Text>
      </View>

      {/* Data rows */}
      {forecasts.map((fc) => {
        const token = TOKENS[fc.symbol];
        const spot = spotPrices?.[fc.symbol as keyof SpotPrices] ?? null;
        const eoySeries = fc.forecasts.find((f) => f.type === 'eoy');
        const best = eoySeries?.mostLikelyBracket;
        const expected = eoySeries?.expectedValue ?? null;

        return (
          <View key={fc.symbol} style={styles.dataRow}>
            <View style={[styles.cell, styles.nameCell, styles.nameInner]}>
              <View style={[styles.dot, { backgroundColor: token?.color ?? Colors.accent }]} />
              <Text style={styles.symbolText}>{fc.symbol}</Text>
            </View>
            <Text style={[styles.cell, styles.valueText]}>
              {formatPrice(spot)}
            </Text>
            <Text style={[styles.cell, styles.valueText]}>
              {formatPrice(expected)}
            </Text>
            <Text style={[styles.cell, styles.probText]}>
              {best ? `${best.probability}%` : '—'}
            </Text>
          </View>
        );
      })}
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
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  cell: {
    flex: 1,
  },
  nameCell: {
    flex: 1.2,
  },
  nameInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  symbolText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  valueText: {
    fontSize: 13,
    color: Colors.text,
  },
  probText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
});
