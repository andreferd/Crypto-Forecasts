import React, { ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ConnectWalletScreen } from '../screens/ConnectWalletScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface WalletGateProps {
  children: ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const { connected, isLoading } = useWallet();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!connected) {
    return <ConnectWalletScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
