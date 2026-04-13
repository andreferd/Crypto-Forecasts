import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { Colors } from '../constants/colors';
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
  agrees: { label: 'Market Agrees', color: Colors.success, icon: 'check-circle' as const },
  disagrees: { label: 'Market Disagrees', color: Colors.error, icon: 'close-circle' as const },
  neutral: { label: 'Neutral', color: Colors.textMuted, icon: 'minus-circle' as const },
};

export function PredictionCard({ evaluation, onDelete }: Props) {
  const { prediction, currentMarketProb, marketAgreement, hypotheticalResult } = evaluation;
  const token = TOKENS[prediction.symbol];
  const agreement = agreementConfig[marketAgreement];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
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
          <Icon source="delete-outline" size={20} color={Colors.textMuted} />
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
        {/* Agreement badge */}
        <View style={[styles.badge, { backgroundColor: agreement.color + '22' }]}>
          <Icon source={agreement.icon} size={14} color={agreement.color} />
          <Text style={[styles.badgeText, { color: agreement.color }]}>
            {agreement.label}
          </Text>
        </View>

        {/* Hypothetical result */}
        {hypotheticalResult !== 'unknown' && (
          <Text
            style={[
              styles.hypothetical,
              {
                color:
                  hypotheticalResult === 'correct' ? Colors.success : Colors.error,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  predictionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  stats: {
    gap: 4,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hypothetical: {
    fontSize: 12,
    fontWeight: '600',
  },
});
