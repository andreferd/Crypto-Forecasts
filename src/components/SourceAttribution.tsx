import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '../theme';

export function SourceAttribution() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kalshi · CoinGecko · Informational only · Not financial advice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  text: {
    ...typography.microStrong,
    fontFamily: typography.caption.fontFamily,
    color: colors.text3,
    fontStyle: 'italic',
  },
});
