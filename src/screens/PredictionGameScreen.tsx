import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { usePredictions } from '../hooks/usePredictions';
import { NewPredictionForm } from '../components/NewPredictionForm';
import { PredictionCard } from '../components/PredictionCard';

export function PredictionGameScreen() {
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

  if (!loaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>You vs The Market</Text>
      <Text style={styles.subtitle}>
        Make price predictions and see how they compare to market consensus
      </Text>

      {/* Score summary */}
      {stats.total > 0 && (
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{stats.total}</Text>
            <Text style={styles.scoreLabel}>Predictions</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: Colors.success }]}>{stats.correct}</Text>
            <Text style={styles.scoreLabel}>Correct*</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: Colors.accent }]}>{stats.agreementRate}%</Text>
            <Text style={styles.scoreLabel}>Market Agrees</Text>
          </View>
        </View>
      )}

      {/* New prediction form */}
      <NewPredictionForm onSubmit={makePrediction} />

      {/* Prediction list */}
      {sortedEvals.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Your Predictions ({sortedEvals.length})
          </Text>
          {sortedEvals.map((ev) => (
            <PredictionCard
              key={ev.prediction.id}
              evaluation={ev}
              onDelete={deletePrediction}
            />
          ))}
        </View>
      )}

      {stats.total > 0 && (
        <Text style={styles.disclaimer}>
          *"Correct" is hypothetical based on current spot price, not final EOY
          resolution. This is a fun exercise, not financial advice.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
