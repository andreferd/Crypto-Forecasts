import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { AccuracyMetrics } from '../types/storage';

interface Props {
  metrics: AccuracyMetrics;
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export function AccuracySymbolCard({ metrics }: Props) {
  const token = TOKENS[metrics.symbol];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
          <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.symbol}>{metrics.symbol}</Text>
          <Text style={styles.daysTracked}>
            {metrics.daysTracked} day{metrics.daysTracked !== 1 ? 's' : ''} tracked
          </Text>
        </View>
      </View>

      {metrics.daysTracked > 0 ? (
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Error</Text>
            <Text style={styles.statValue}>{formatPrice(metrics.meanAbsoluteError)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Error %</Text>
            <Text style={styles.statValue}>{metrics.meanPercentError}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Brier Score</Text>
            <Text style={styles.statValue}>{metrics.brierLikeScore}</Text>
          </View>
          {metrics.latestEntry && (
            <View style={styles.latestRow}>
              <Text style={styles.latestLabel}>Latest:</Text>
              <Text style={styles.latestValue}>
                Forecast {formatPrice(metrics.latestEntry.expectedValue)} vs Spot{' '}
                {formatPrice(metrics.latestEntry.spotPrice)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.noData}>No data yet — check back tomorrow</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  daysTracked: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  latestRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  latestLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  latestValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noData: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
