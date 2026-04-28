import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme';

const STORAGE_KEY = '@crypto_forecasts_edu_seen';

export function EducationalTooltip() {
  const [visible, setVisible] = useState(false);
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        setVisible(true);
        Animated.parallel([
          Animated.timing(height, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        ]).start();
      }
    });
  }, [height, opacity]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(height, { toValue: 0, duration: 220, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start(() => {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, '1');
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { opacity, maxHeight: height.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Icon source="lightbulb-on-outline" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>How to read this app</Text>
          <Text style={styles.body}>
            Each card shows a crypto's <Text style={styles.em}>probability distribution</Text>{' '}
            for end-of-year. The dashed line is the current spot price. Higher curves
            mean more market <Text style={styles.em}>belief</Text> on that range. Tap
            a card to drill in or place a call.
          </Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss explainer"
        >
          <Icon source="close" size={18} color={colors.text3} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.accent + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text1,
  },
  body: {
    ...typography.bodySm,
    color: colors.text2,
  },
  em: {
    color: colors.text1,
    fontFamily: typography.bodyStrong.fontFamily,
  },
});
