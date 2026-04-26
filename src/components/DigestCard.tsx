import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { directionColor } from '../theme/semantics';
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
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? colors.accent }]}>
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
                  color: directionColor(digest.expectedValueDelta ?? 0),
                  fontFamily: typography.bodyStrong.fontFamily,
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
                  style={[styles.diffDelta, { color: directionColor(diff.delta) }]}
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
  evChange: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
  diffs: {
    gap: spacing.xs + 2,
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
  },
  biggestMover: {
    borderWidth: 1,
    borderColor: colors.accent + '44',
    backgroundColor: colors.accent + '11',
  },
  diffRange: {
    ...typography.body,
    fontSize: 13,
    color: colors.text1,
    flex: 1,
    marginRight: spacing.sm,
  },
  diffValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  diffOld: {
    ...typography.body,
    fontSize: 13,
    color: colors.text3,
  },
  diffArrow: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text3,
  },
  diffNew: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text1,
  },
  diffDelta: {
    ...typography.bodyStrong,
    fontSize: 13,
    minWidth: 42,
    textAlign: 'right',
  },
  noChanges: {
    ...typography.body,
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
