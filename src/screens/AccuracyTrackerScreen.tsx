import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { useAccuracyData } from '../hooks/useAccuracyData';
import { AccuracySymbolCard } from '../components/AccuracySymbolCard';
import { WeeklyReportCardComponent } from '../components/WeeklyReportCard';

export function AccuracyTrackerScreen() {
  const { metrics, weeklyReports, hasData, loading, refresh } = useAccuracyData();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Accuracy Tracker</Text>
        <Text style={styles.emptyText}>
          This screen tracks how well Kalshi forecast expected values compare to
          actual spot prices over time. Data will be recorded automatically each
          day you open the app.
        </Text>
        <Text style={styles.emptyHint}>Check back tomorrow for your first data point.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={Colors.accent}
        />
      }
    >
      <Text style={styles.title}>Accuracy Tracker</Text>
      <Text style={styles.subtitle}>
        How well do prediction markets forecast actual prices?
      </Text>

      {/* Per-symbol cards */}
      {metrics.map((m) => (
        <AccuracySymbolCard key={m.symbol} metrics={m} />
      ))}

      {/* Weekly reports */}
      {weeklyReports.length > 0 && (
        <View style={styles.weeklySection}>
          <Text style={styles.sectionTitle}>Weekly Reports</Text>
          {weeklyReports.map((report) => (
            <WeeklyReportCardComponent
              key={report.weekStart}
              report={report}
            />
          ))}
        </View>
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
    padding: 32,
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  weeklySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
});
