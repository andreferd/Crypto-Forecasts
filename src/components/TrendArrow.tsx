import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

interface TrendArrowProps {
  direction: 'up' | 'down' | 'flat';
  changePercent: number;
}

export function TrendArrow({ direction, changePercent }: TrendArrowProps) {
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '▬';
  const color =
    direction === 'up'
      ? Colors.success
      : direction === 'down'
        ? Colors.error
        : Colors.textMuted;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>
        {arrow} {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}% vs last week
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
