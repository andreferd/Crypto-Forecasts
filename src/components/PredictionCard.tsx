import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { PredictionEvaluation } from '../types/storage';

interface Props {
  evaluation: PredictionEvaluation;
  onDelete: (id: string) => void;
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const agreementConfig = {
  agrees: { label: 'Market Agrees', color: colors.up, icon: 'check-circle' as const },
  disagrees: { label: 'Market Disagrees', color: colors.down, icon: 'close-circle' as const },
  neutral: { label: 'Neutral', color: colors.text3, icon: 'minus-circle' as const },
};

export function PredictionCard({ evaluation, onDelete }: Props) {
  const { prediction, currentMarketProb, marketAgreement, hypotheticalResult } = evaluation;
  const token = TOKENS[prediction.symbol];
  const agreement = agreementConfig[marketAgreement];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? colors.accent }]}>
          <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.predictionText}>
            {prediction.symbol} {prediction.direction} {formatPrice(prediction.targetPrice)}
          </Text>
          <Text style={styles.dateText}>
            Made {formatDate(prediction.createdAt)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(prediction.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon source="delete-outline" size={20} color={colors.text3} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Market prob (then)</Text>
          <Text style={styles.statValue}>{prediction.marketProbAtTime}%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Market prob (now)</Text>
          <Text style={styles.statValue}>{currentMarketProb}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: agreement.color + '22' }]}>
          <Icon source={agreement.icon} size={14} color={agreement.color} />
          <Text style={[styles.badgeText, { color: agreement.color }]}>
            {agreement.label}
          </Text>
        </View>

        {hypotheticalResult !== 'unknown' && (
          <Text
            style={[
              styles.hypothetical,
              {
                color: hypotheticalResult === 'correct' ? colors.up : colors.down,
              },
            ]}
          >
            If resolved today: {hypotheticalResult === 'correct' ? 'Correct' : 'Incorrect'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    ...typography.bodyStrong,
    color: colors.text1,
  },
  headerInfo: {
    flex: 1,
  },
  predictionText: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.text1,
    textTransform: 'capitalize',
  },
  dateText: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 1,
  },
  stats: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  statLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
  },
  statValue: {
    ...typography.bodyStrong,
    color: colors.text1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  badgeText: {
    ...typography.captionStrong,
  },
  hypothetical: {
    ...typography.captionStrong,
  },
});
