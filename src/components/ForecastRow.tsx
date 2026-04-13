import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

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
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.accentDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
});
