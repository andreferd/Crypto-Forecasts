import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography } from '../theme';
import { usePredictions } from '../hooks/usePredictions';
import { NewPredictionForm } from '../components/NewPredictionForm';
import { PredictionCard } from '../components/PredictionCard';

export function PredictionGameScreen() {
  const insets = useSafeAreaInsets();
  const { evaluations, loaded, makePrediction, deletePrediction } = usePredictions();

  const sortedEvals = useMemo(
    () => [...evaluations].sort((a, b) => b.prediction.createdAt - a.prediction.createdAt),
    [evaluations],
  );

  const stats = useMemo(() => {
    const total = evaluations.length;
    const correct = evaluations.filter((e) => e.hypotheticalResult === 'correct').length;
    const agrees = evaluations.filter((e) => e.marketAgreement === 'agrees').length;
    return { total, correct, agreementRate: total > 0 ? Math.round((agrees / total) * 100) : 0 };
  }, [evaluations]);

  // Streak: how many consecutive days (ending today) have at least one prediction.
  const streak = useMemo(() => {
    if (evaluations.length === 0) return 0;
    const dates = new Set(
      evaluations.map((e) => new Date(e.prediction.createdAt).toISOString().slice(0, 10)),
    );
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    // Allow a 1-day grace if the most recent prediction was yesterday but not today.
    let grace = !dates.has(cursor.toISOString().slice(0, 10));
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (dates.has(key)) {
        count++;
        grace = false;
      } else if (grace) {
        grace = false; // skip today, count from yesterday
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [evaluations]);

  if (!loaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Call it</Text>
        <Text style={styles.subtitle}>
          Think you know where crypto lands by year-end? Set a target and see how the market answers.
        </Text>
      </View>

      {stats.total > 0 && (
        <View style={styles.scoreRow}>
          <Stat
            label={streak === 1 ? 'Day streak' : 'Day streak'}
            value={streak > 0 ? `🔥 ${streak}` : '0'}
            color={streak >= 3 ? colors.warning : streak > 0 ? colors.accent : undefined}
          />
          <Stat label="On track" value={`${stats.correct}/${stats.total}`} color={colors.up} />
          <Stat label="Market agrees" value={`${stats.agreementRate}%`} color={colors.accent} />
        </View>
      )}

      <NewPredictionForm onSubmit={makePrediction} />

      {sortedEvals.length > 0 ? (
        <View style={styles.listSection}>
          <Text style={styles.sectionLabel}>Your calls ({sortedEvals.length})</Text>
          {sortedEvals.map((ev) => (
            <PredictionCard
              key={ev.prediction.id}
              evaluation={ev}
              onDelete={deletePrediction}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyList}>
          <Text style={styles.emptyText}>No calls yet. Your first prediction appears here.</Text>
        </View>
      )}

      {stats.total > 0 && (
        <Text style={styles.disclaimer}>
          "On track" uses today's spot price, not the final EOY resolution. For fun, not finance.
        </Text>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={[styles.scoreValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.hero,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text1,
  },
  subtitle: {
    ...typography.body,
    color: colors.text2,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreValue: {
    ...typography.title,
    fontSize: 22,
    ...typography.numeric,
    color: colors.text1,
  },
  scoreLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
    marginTop: 2,
  },
  listSection: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.captionStrong,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emptyList: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text3,
    textAlign: 'center',
  },
  disclaimer: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text3,
    lineHeight: 16,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
