import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { WeeklyReportCard as WeeklyReportCardType } from '../types/storage';

interface Props {
  report: WeeklyReportCardType;
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WeeklyReportCardComponent({ report }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.dateRange}>
            {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
          </Text>
          <Text style={styles.avgError}>
            Avg error: {formatPrice(report.avgError)} ({report.avgPercentError}%)
          </Text>
        </View>
        <Icon
          source={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text3}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.breakdown}>
          {report.symbolBreakdown.map((sb) => {
            const token = TOKENS[sb.symbol];
            return (
              <View key={sb.symbol} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View
                    style={[styles.dot, { backgroundColor: token?.color ?? colors.accent }]}
                  />
                  <Text style={styles.breakdownSymbol}>{sb.symbol}</Text>
                </View>
                <Text style={styles.breakdownValue}>
                  {formatPrice(sb.avgError)} ({sb.avgPercentError}%)
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  dateRange: {
    ...typography.bodyStrong,
    color: colors.text1,
  },
  avgError: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
  breakdown: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownSymbol: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text1,
  },
  breakdownValue: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
  },
});
