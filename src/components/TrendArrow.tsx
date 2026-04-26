import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, typography } from '../theme';

interface TrendArrowProps {
  direction: 'up' | 'down' | 'flat';
  changePercent: number;
}

export function TrendArrow({ direction, changePercent }: TrendArrowProps) {
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '▬';
  const color =
    direction === 'up'
      ? colors.up
      : direction === 'down'
        ? colors.down
        : colors.text3;

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
    ...typography.captionStrong,
    fontSize: 11,
    ...typography.numeric,
  },
});
