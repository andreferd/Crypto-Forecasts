import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
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
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? colors.accent }]}>
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
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.text1,
  },
  headerInfo: {
    flex: 1,
  },
  symbol: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text1,
  },
  daysTracked: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
  },
  statValue: {
    ...typography.bodyStrong,
    ...typography.numeric,
    color: colors.text1,
  },
  latestRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  latestLabel: {
    ...typography.caption,
    color: colors.text3,
    marginBottom: 2,
  },
  latestValue: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
  },
  noData: {
    ...typography.body,
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
