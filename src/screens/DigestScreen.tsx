import React from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { useDigest } from '../hooks/useDigest';
import { useAlertSettings } from '../hooks/useAlertSettings';
import { DigestCard } from '../components/DigestCard';

function formatAge(ms: number | null): string {
  if (ms == null) return '';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function DigestScreen() {
  const { digests, isLoading, isFirstVisit, snapshotAge, markDigestSeen, hasData } = useDigest();
  const { settings, toggleEnabled, setThreshold } = useAlertSettings();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading digest...</Text>
      </View>
    );
  }

  if (isFirstVisit) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.welcomeTitle}>Daily Digest</Text>
        <Text style={styles.welcomeText}>
          Track how crypto forecasts change day to day. Start tracking to see
          probability shifts and expected value changes.
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={markDigestSeen}>
          <Text style={styles.startButtonText}>Start Tracking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What Changed</Text>
        {snapshotAge != null && (
          <Text style={styles.age}>Last checked: {formatAge(snapshotAge)}</Text>
        )}
      </View>

      {/* Digest cards */}
      {digests.map((digest) => (
        <DigestCard key={digest.symbol} digest={digest} />
      ))}

      {/* Got it button */}
      {hasData && (
        <TouchableOpacity style={styles.gotItButton} onPress={markDigestSeen}>
          <Text style={styles.gotItText}>Got it</Text>
        </TouchableOpacity>
      )}

      {/* Alert settings */}
      <View style={styles.alertSection}>
        <Text style={styles.alertTitle}>Shift Alerts</Text>
        <View style={styles.alertRow}>
          <Text style={styles.alertLabel}>
            Notify on {settings.thresholdPercent}%+ shifts
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              settings.enabled && styles.toggleButtonActive,
            ]}
            onPress={toggleEnabled}
          >
            <Text
              style={[
                styles.toggleText,
                settings.enabled && styles.toggleTextActive,
              ]}
            >
              {settings.enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        {settings.enabled && (
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Threshold:</Text>
            {[3, 5, 10].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.thresholdPill,
                  settings.thresholdPercent === t && styles.thresholdPillActive,
                ]}
                onPress={() => setThreshold(t)}
              >
                <Text
                  style={[
                    styles.thresholdPillText,
                    settings.thresholdPercent === t && styles.thresholdPillTextActive,
                  ]}
                >
                  {t}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  age: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gotItButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  gotItText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  alertSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.accent,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  thresholdLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  thresholdPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thresholdPillActive: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.accent,
  },
  thresholdPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  thresholdPillTextActive: {
    color: Colors.accent,
  },
});
