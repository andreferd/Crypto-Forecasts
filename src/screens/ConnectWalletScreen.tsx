import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { ConnectWalletButton } from '../components/ConnectWalletButton';

export function ConnectWalletScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icons}>
          <Text style={[styles.tokenIcon, { color: Colors.btc }]}>{'₿'}</Text>
          <Text style={[styles.tokenIcon, { color: Colors.eth }]}>{'Ξ'}</Text>
          <Text style={[styles.tokenIcon, { color: Colors.sol }]}>{'◎'}</Text>
        </View>
        <Text style={styles.title}>Crypto Forecasts</Text>
        <Text style={styles.subtitle}>
          Real-time price predictions from Kalshi prediction markets for BTC,
          ETH, and SOL.
        </Text>
      </View>
      <View style={styles.bottom}>
        <ConnectWalletButton />
        <Text style={styles.hint}>
          Connect your Solana wallet to get started
        </Text>
        <Text style={styles.disclaimer}>
          Not financial advice. Data from Kalshi prediction markets for
          informational purposes only.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icons: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  tokenIcon: {
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 280,
    marginTop: 8,
  },
});
