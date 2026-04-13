import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

interface DataFreshnessIndicatorProps {
  dataUpdatedAt: number; // timestamp in ms
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

function getDotColor(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = diff / 60_000;
  if (minutes < 5) return Colors.freshGreen;
  if (minutes < 30) return Colors.freshYellow;
  return Colors.freshRed;
}

export function DataFreshnessIndicator({ dataUpdatedAt }: DataFreshnessIndicatorProps) {
  const [, setTick] = useState(0);

  // Re-render every 30s to keep time-ago updated
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!dataUpdatedAt) return null;

  const dotColor = getDotColor(dataUpdatedAt);
  const timeAgo = getTimeAgo(dataUpdatedAt);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.text}>Updated {timeAgo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
