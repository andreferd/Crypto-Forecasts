import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { directionColor } from '../theme/semantics';
import { useDigest } from '../hooks/useDigest';
import { TOKENS } from '../constants/tokens';

interface FlatChange {
  symbol: string;
  displayRange: string;
  delta: number;
  oldProb: number;
  newProb: number;
}

interface Props {
  limit?: number;
}

/**
 * Inline strip narrating the top probability shifts since last snapshot.
 * Replaces the standalone Digest tab.
 */
export function WhatChangedStrip({ limit = 3 }: Props) {
  const { digests, snapshotAge, hasSignificantChanges, markDigestSeen } = useDigest();

  const top: FlatChange[] = useMemo(() => {
    const all: FlatChange[] = [];
    for (const d of digests) {
      for (const diff of d.bracketDiffs) {
        all.push({
          symbol: d.symbol,
          displayRange: diff.displayRange,
          delta: diff.delta,
          oldProb: diff.oldProb,
          newProb: diff.newProb,
        });
      }
    }
    return all
      .filter((c) => Math.abs(c.delta) >= 1)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, limit);
  }, [digests, limit]);

  if (top.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Icon source="pulse" size={16} color={colors.text2} />
          <Text style={styles.header}>Recent shifts</Text>
        </View>
        <Text style={styles.empty}>
          {snapshotAge != null && snapshotAge < 1000 * 60 * 60
            ? 'Quiet hour — nothing material moved.'
            : 'Quiet day — nothing material moved.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon source="pulse" size={16} color={colors.accent} />
        <Text style={styles.header}>Recent shifts</Text>
        {hasSignificantChanges && (
          <TouchableOpacity onPress={markDigestSeen} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.dismiss}>Mark seen</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.list}>
        {top.map((c, i) => (
          <ChangeRow key={`${c.symbol}-${c.displayRange}-${i}`} change={c} />
        ))}
      </View>
    </View>
  );
}

function ChangeRow({ change }: { change: FlatChange }) {
  const token = TOKENS[change.symbol];
  const color = directionColor(change.delta);
  const arrow = change.delta > 0 ? '↑' : change.delta < 0 ? '↓' : '·';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: token?.color ?? colors.accent }]} />
      <Text style={styles.body} numberOfLines={1}>
        <Text style={styles.symbol}>{change.symbol} </Text>
        <Text style={styles.range}>{change.displayRange}</Text>
        <Text style={styles.muted}> · {change.oldProb}% → {change.newProb}%</Text>
      </Text>
      <Text style={[styles.delta, { color }]}>
        {arrow} {change.delta > 0 ? '+' : ''}{change.delta}pp
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  header: {
    ...typography.captionStrong,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  dismiss: {
    ...typography.captionStrong,
    color: colors.accent,
  },
  list: {
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    flex: 1,
    ...typography.bodySm,
    color: colors.text2,
  },
  symbol: {
    ...typography.bodySmStrong,
    color: colors.text1,
  },
  range: {
    ...typography.bodySm,
    ...typography.numeric,
    color: colors.text1,
  },
  muted: {
    ...typography.caption,
    ...typography.numeric,
    color: colors.text3,
  },
  delta: {
    ...typography.captionStrong,
    ...typography.numeric,
  },
  empty: {
    ...typography.bodySm,
    color: colors.text3,
    fontStyle: 'italic',
  },
});
