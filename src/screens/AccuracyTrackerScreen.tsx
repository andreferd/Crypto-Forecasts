import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { TrackRecordChart } from '../components/TrackRecordChart';

const SYMBOLS = ['BTC', 'ETH', 'SOL'];

export function AccuracyTrackerScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Track record</Text>
        <Text style={styles.subtitle}>
          Year-end forecast vs. actual spot price over the past 90 days. Closer
          lines = sharper market.
        </Text>
      </View>

      {SYMBOLS.map((s) => (
        <TrackRecordChart key={s} symbol={s} days={90} />
      ))}

      <Text style={styles.legend}>
        Forecast: market consensus expected value (Kalshi). Spot: actual price
        history (CoinGecko).
      </Text>
    </ScrollView>
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
  header: {
    marginBottom: spacing.lg,
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
  legend: {
    ...typography.caption,
    color: colors.text3,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    lineHeight: 14,
  },
});
