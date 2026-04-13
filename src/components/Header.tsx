import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { useWallet } from '../hooks/useWallet';

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header() {
  const { publicKey, disconnect } = useWallet();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Crypto Forecasts</Text>
        {publicKey && (
          <Text style={styles.address}>{truncateAddress(publicKey)}</Text>
        )}
      </View>
      {publicKey && (
        <IconButton
          icon="logout"
          iconColor={Colors.textSecondary}
          size={20}
          onPress={disconnect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  address: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
