import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme';

// Markets explainer key — also toggled by the Settings experience picker
// and OnboardingScreen, so it must stay stable.
const MARKETS_KEY = '@crypto_forecasts_edu_seen';
export const PREDICT_TIP_KEY = '@crypto_forecasts_predict_tip_seen';
export const TRACK_TIP_KEY = '@crypto_forecasts_track_tip_seen';

/** All first-run tip keys — used by Settings "Show tips again". */
export const ALL_TIP_KEYS = [MARKETS_KEY, PREDICT_TIP_KEY, TRACK_TIP_KEY];

interface TipBannerProps {
  storageKey: string;
  title: string;
  /** Banner body — pass a string or styled <Text> spans. */
  body: React.ReactNode;
  icon?: string;
}

/**
 * One-time dismissible tip banner. Reads its `storageKey` from AsyncStorage
 * on mount; renders only if unseen. Animations run on the native driver
 * (opacity + translateY) so they stay smooth under JS-thread load.
 */
export function TipBanner({
  storageKey,
  title,
  body,
  icon = 'lightbulb-on-outline',
}: TipBannerProps) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((val) => {
      if (cancelled || val) return;
      setVisible(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, opacity, translateY]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      AsyncStorage.setItem(storageKey, '1');
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Icon source={icon} size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
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

/** Markets-screen explainer. Thin wrapper kept so DashboardScreen is unchanged. */
export function EducationalTooltip() {
  return (
    <TipBanner
      storageKey={MARKETS_KEY}
      title="How to read this app"
      body={
        <>
          Each card shows a crypto's{' '}
          <Text style={styles.em}>probability distribution</Text> for end-of-year.
          The dashed line is the current spot price. Higher curves mean more market{' '}
          <Text style={styles.em}>belief</Text> on that range. Tap a card to drill in
          or place a call — and open <Text style={styles.em}>Settings</Text> (top-right)
          to get alerted when the odds shift.
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  banner: {
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
