import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

export type TimePeriod = '1W' | '1M' | '3M' | 'ALL';

const PERIODS: { key: TimePeriod; days: number; label: string }[] = [
  { key: '1W', days: 7, label: '1W' },
  { key: '1M', days: 30, label: '1M' },
  { key: '3M', days: 90, label: '3M' },
  { key: 'ALL', days: 365, label: 'ALL' },
];

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onSelect: (period: TimePeriod) => void;
}

export function periodToDays(period: TimePeriod): number {
  return PERIODS.find((p) => p.key === period)?.days ?? 30;
}

export function TimePeriodSelector({ selected, onSelect }: TimePeriodSelectorProps) {
  return (
    <View style={styles.container}>
      {PERIODS.map((p) => {
        const active = p.key === selected;
        return (
          <TouchableOpacity
            key={p.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
  },
  pillActive: {
    backgroundColor: Colors.accentDim,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.accent,
  },
});
