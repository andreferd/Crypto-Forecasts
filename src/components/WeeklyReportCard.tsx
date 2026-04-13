import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { Colors } from '../constants/colors';
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
          color={Colors.textMuted}
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
                    style={[
                      styles.dot,
                      { backgroundColor: token?.color ?? Colors.accent },
                    ]}
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flex: 1,
  },
  dateRange: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  avgError: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  breakdown: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownSymbol: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  breakdownValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
