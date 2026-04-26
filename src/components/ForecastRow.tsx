import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';

interface ForecastRowProps {
  label: string;
  value: string;
  probability?: number;
}

export function ForecastRow({ label, value, probability }: ForecastRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        <Text style={styles.value}>{value}</Text>
        {probability != null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{probability}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    ...typography.bodyStrong,
    ...typography.numeric,
    color: colors.text1,
  },
  badge: {
    backgroundColor: colors.accent + '22',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.captionStrong,
    color: colors.accent,
  },
});
