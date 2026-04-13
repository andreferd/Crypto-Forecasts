import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { SymbolDigest } from '../types/storage';

interface Props {
  digest: SymbolDigest;
}

function formatValue(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDelta(delta: number | null): string {
  if (delta == null) return '';
  const sign = delta >= 0 ? '+' : '';
  if (Math.abs(delta) >= 1000) {
    return `${sign}$${(delta / 1000).toFixed(Math.abs(delta) >= 10000 ? 0 : 1)}k`;
  }
  return `${sign}$${delta.toLocaleString()}`;
}

export function DigestCard({ digest }: Props) {
  const token = TOKENS[digest.symbol];
  const topDiffs = digest.bracketDiffs.slice(0, 3);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
          <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.symbol}>{digest.symbol}</Text>
          {digest.oldExpectedValue != null && digest.newExpectedValue != null && (
            <Text style={styles.evChange}>
              {formatValue(digest.oldExpectedValue)} → {formatValue(digest.newExpectedValue)}
              {'  '}
              <Text
                style={{
                  color: (digest.expectedValueDelta ?? 0) >= 0 ? Colors.success : Colors.error,
                  fontWeight: '700',
                }}
              >
                {formatDelta(digest.expectedValueDelta)}
              </Text>
            </Text>
          )}
          {digest.oldExpectedValue == null && digest.newExpectedValue != null && (
            <Text style={styles.evChange}>
              Expected: {formatValue(digest.newExpectedValue)}
            </Text>
          )}
        </View>
      </View>

      {/* Bracket diffs */}
      {topDiffs.length > 0 ? (
        <View style={styles.diffs}>
          {topDiffs.map((diff, i) => (
            <View
              key={diff.displayRange}
              style={[
                styles.diffRow,
                i === 0 && diff === digest.biggestMover && styles.biggestMover,
              ]}
            >
              <Text style={styles.diffRange} numberOfLines={1}>
                {diff.displayRange}
              </Text>
              <View style={styles.diffValues}>
                <Text style={styles.diffOld}>{diff.oldProb}%</Text>
                <Text style={styles.diffArrow}>→</Text>
                <Text style={styles.diffNew}>{diff.newProb}%</Text>
                <Text
                  style={[
                    styles.diffDelta,
                    { color: diff.delta >= 0 ? Colors.success : Colors.error },
                  ]}
                >
                  {diff.delta >= 0 ? '+' : ''}{diff.delta}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noChanges}>No significant changes</Text>
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
  evChange: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  diffs: {
    gap: 6,
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
  },
  biggestMover: {
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    backgroundColor: Colors.accent + '11',
  },
  diffRange: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  diffValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diffOld: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  diffArrow: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  diffNew: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  diffDelta: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'right',
  },
  noChanges: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
