import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { freshnessColor } from '../theme/semantics';

interface DataFreshnessIndicatorProps {
  dataUpdatedAt: number;
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DataFreshnessIndicator({ dataUpdatedAt }: DataFreshnessIndicatorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!dataUpdatedAt) return null;

  const minutesAgo = (Date.now() - dataUpdatedAt) / 60_000;
  const dotColor = freshnessColor(minutesAgo);

  return (
    <View
      style={[styles.dot, { backgroundColor: dotColor }]}
      accessibilityLabel={`Data updated ${getTimeAgo(dataUpdatedAt)}`}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
