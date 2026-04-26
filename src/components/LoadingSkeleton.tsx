import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radii } from '../theme';

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
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
  },
  headerText: {
    gap: spacing.xs + 2,
  },
  line: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
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
