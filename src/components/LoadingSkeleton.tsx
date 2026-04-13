import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

export function LoadingSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.circle, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.line, styles.lineShort, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineMedium, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.line, styles.lineFull, { opacity }]} />
      <Animated.View style={[styles.line, styles.lineFull, { opacity }]} />
      <Animated.View style={[styles.line, styles.lineMedium, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
  },
  headerText: {
    gap: 6,
  },
  line: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },
  lineShort: {
    width: 60,
  },
  lineMedium: {
    width: 120,
  },
  lineFull: {
    width: '100%',
  },
});
