import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography } from '../theme';
import { useWallet } from '../hooks/useWallet';
import { useAlertSettings } from '../hooks/useAlertSettings';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingChoice } from '../services/storageService';
import { ConnectWalletButton } from '../components/ConnectWalletButton';

const EDU_TOOLTIP_KEY = '@crypto_forecasts_edu_seen';

const EXPERIENCE_OPTIONS: { value: OnboardingChoice; label: string; hint: string }[] = [
  { value: 'newbie', label: 'New to this', hint: 'Show explainers in Markets.' },
  { value: 'advanced', label: 'Experienced', hint: 'Skip the explainers.' },
];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { publicKey, connected, disconnect } = useWallet();
  const { settings, toggleEnabled, setThreshold } = useAlertSettings();
  const { choice, complete } = useOnboarding();
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined' | 'unknown'>('unknown');

  const handleExperienceChange = async (next: OnboardingChoice) => {
    if (next === choice) return;
    if (next === 'advanced') {
      await AsyncStorage.setItem(EDU_TOOLTIP_KEY, '1');
    } else {
      await AsyncStorage.removeItem(EDU_TOOLTIP_KEY);
    }
    await complete(next);
  };

  useEffect(() => {
    Notifications.getPermissionsAsync().then((res) => {
      setNotifStatus((res.status as any) ?? 'unknown');
    });
  }, []);

  const handleClearData = () => {
    Alert.alert(
      'Clear local data?',
      'This removes all stored predictions, accuracy history, digest snapshots, and alert baselines. The app will reload from fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const ours = keys.filter(
              (k) => k.startsWith('@crypto-forecasts/') || k.startsWith('@crypto_forecasts_'),
            );
            await AsyncStorage.multiRemove(ours);
            Alert.alert('Done', 'Local data cleared.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 64 + insets.bottom }]}
    >
      <Section title="Wallet">
        {connected && publicKey ? (
          <>
            <Row label="Connected" value={truncateAddress(publicKey)} valueColor={colors.up} />
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={() => disconnect()}
              activeOpacity={0.7}
            >
              <Icon source="logout-variant" size={18} color={colors.down} />
              <Text style={styles.dangerText}>Disconnect wallet</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.walletCta}>
            <Text style={styles.walletHint}>
              Optional — connect a Solana wallet to identify yourself. Forecasts work without it.
            </Text>
            <ConnectWalletButton />
          </View>
        )}
      </Section>

      <Section title="Experience">
        {EXPERIENCE_OPTIONS.map((opt, idx) => {
          const active = choice === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.choiceRow, idx > 0 && styles.choiceRowDivider]}
              onPress={() => handleExperienceChange(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.choiceText}>
                <Text style={styles.rowLabel}>{opt.label}</Text>
                <Text style={styles.choiceHint}>{opt.hint}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </Section>

      <Section title="Shift Alerts">
        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            Push me when a bracket moves {settings.thresholdPercent}%+
          </Text>
          <TouchableOpacity
            style={[styles.toggle, settings.enabled && styles.toggleOn]}
            onPress={toggleEnabled}
          >
            <Text style={[styles.toggleText, settings.enabled && styles.toggleTextOn]}>
              {settings.enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        {settings.enabled && (
          <View style={styles.thresholdRow}>
            <Text style={styles.rowLabel}>Threshold</Text>
            <View style={styles.pills}>
              {[3, 5, 10].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, settings.thresholdPercent === t && styles.pillActive]}
                  onPress={() => setThreshold(t)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      settings.thresholdPercent === t && styles.pillTextActive,
                    ]}
                  >
                    {t}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Section>

      <Section title="Notifications">
        <Row
          label="System permission"
          value={
            notifStatus === 'granted'
              ? 'Granted'
              : notifStatus === 'denied'
                ? 'Denied'
                : 'Not requested'
          }
          valueColor={
            notifStatus === 'granted'
              ? colors.up
              : notifStatus === 'denied'
                ? colors.down
                : colors.text2
          }
        />
      </Section>

      <Section title="Data">
        <TouchableOpacity style={styles.dangerRow} onPress={handleClearData} activeOpacity={0.7}>
          <Icon source="trash-can-outline" size={18} color={colors.down} />
          <Text style={styles.dangerText}>Clear local data</Text>
        </TouchableOpacity>
      </Section>

      <Section title="About">
        <Row
          label="App version"
          value={`${Constants.expoConfig?.version ?? '—'} · beta`}
        />
        <Row label="Data source" value="Kalshi · CoinGecko" />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text1,
    flex: 1,
  },
  rowValue: {
    ...typography.body,
    color: colors.text2,
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOn: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  toggleText: {
    ...typography.captionStrong,
    color: colors.text3,
  },
  toggleTextOn: {
    color: colors.accent,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  pillText: {
    ...typography.captionStrong,
    color: colors.text3,
  },
  pillTextActive: {
    color: colors.accent,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dangerText: {
    ...typography.bodyStrong,
    color: colors.down,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  choiceRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  choiceText: {
    flex: 1,
  },
  choiceHint: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  walletCta: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  walletHint: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    lineHeight: 19,
  },
});
