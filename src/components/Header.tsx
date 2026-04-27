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
        <Text style={styles.title}>Crypto Forecasts</Text>
        {connected && publicKey && (
          <Text style={styles.subtitle}>{truncateAddress(publicKey)}</Text>
        )}
      </View>
      {dataUpdatedAt ? <DataFreshnessIndicator dataUpdatedAt={dataUpdatedAt} /> : null}
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
  title: {
    ...typography.title,
    color: colors.text1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text2,
    marginTop: 2,
  },
});
