import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

interface VolumeBadgeProps {
  volume: number;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${Math.round(v)}`;
}

export function VolumeBadge({ volume }: VolumeBadgeProps) {
  if (volume <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Vol {formatVolume(volume)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  text: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
