import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { MarketsStackParamList } from '../types/navigation';
import { useWallet } from '../hooks/useWallet';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

interface Props {
  dataUpdatedAt?: number;
}

export function Header({ dataUpdatedAt }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MarketsStackParamList>>();
  const { publicKey, connected } = useWallet();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Crowd Price</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
          {dataUpdatedAt ? <DataFreshnessIndicator dataUpdatedAt={dataUpdatedAt} /> : null}
        </View>
        {connected && publicKey && (
          <Text style={styles.subtitle}>{truncateAddress(publicKey)}</Text>
        )}
      </View>
      <IconButton
        icon="cog-outline"
        iconColor={colors.text2}
        size={22}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Open settings"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text1,
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  betaText: {
    ...typography.captionStrong,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.text3,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text2,
    marginTop: 2,
  },
});
