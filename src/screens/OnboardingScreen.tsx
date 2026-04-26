import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingChoice } from '../services/storageService';

const EDU_TOOLTIP_KEY = '@crypto_forecasts_edu_seen';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { complete } = useOnboarding();

  const pick = async (choice: OnboardingChoice) => {
    if (choice === 'advanced') {
      // Suppress the in-Markets explainer for power users
      await AsyncStorage.setItem(EDU_TOOLTIP_KEY, '1');
    } else {
      // Make sure newbies see the tooltip even if it was previously dismissed
      await AsyncStorage.removeItem(EDU_TOOLTIP_KEY);
    }
    await complete(choice);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 32 + insets.top, paddingBottom: 32 + insets.bottom },
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.markRow}>
          <Bar h={28} />
          <Bar h={48} />
          <Bar h={64} highlight />
          <Bar h={48} />
          <Bar h={28} />
        </View>
        <Text style={styles.brandName}>Crypto Forecasts</Text>
      </View>

      <Text style={styles.title}>How familiar are you with{'\n'}prediction markets?</Text>
      <Text style={styles.subtitle}>
        We'll tailor a few hints. You can always change this in Settings.
      </Text>

      <View style={styles.options}>
        <Choice
          label="I'm new to this"
          description="Show me what these graphs mean and how to read them."
          glyph={<NewbieGlyph />}
          onPress={() => pick('newbie')}
        />
        <Choice
          label="I know forecasts"
          description="Skip the explainers — straight to the data."
          glyph={<AdvancedGlyph />}
          onPress={() => pick('advanced')}
        />
      </View>

      <Text style={styles.footer}>
        Data is from Kalshi prediction markets and CoinGecko. Informational only.
      </Text>
    </ScrollView>
  );
}

function Bar({ h, highlight }: { h: number; highlight?: boolean }) {
  return (
    <View
      style={{
        width: 12,
        height: h,
        borderRadius: 4,
        backgroundColor: highlight ? colors.accentStrong : colors.accent,
      }}
    />
  );
}

function Choice({
  label,
  description,
  glyph,
  onPress,
}: {
  label: string;
  description: string;
  glyph: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.choice} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.choiceIcon}>{glyph}</View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceDesc}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function NewbieGlyph() {
  // A small "sprout" — two short bars rising
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      <View style={{ width: 4, height: 10, borderRadius: 2, backgroundColor: colors.accent }} />
      <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: colors.accentStrong }} />
    </View>
  );
}

function AdvancedGlyph() {
  // A 4-bar mini histogram — echoes the brand mark
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      <View style={{ width: 3, height: 8, borderRadius: 1, backgroundColor: colors.accent }} />
      <View style={{ width: 3, height: 14, borderRadius: 1, backgroundColor: colors.accent }} />
      <View style={{ width: 3, height: 18, borderRadius: 1, backgroundColor: colors.accentStrong }} />
      <View style={{ width: 3, height: 12, borderRadius: 1, backgroundColor: colors.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  brandName: {
    ...typography.captionStrong,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    ...typography.hero,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLg,
    fontSize: 15,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accent + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceText: {
    flex: 1,
    gap: 3,
  },
  choiceLabel: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.text1,
  },
  choiceDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: colors.text3,
    lineHeight: 24,
    marginLeft: spacing.xs,
  },
  footer: {
    ...typography.caption,
    color: colors.text3,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
