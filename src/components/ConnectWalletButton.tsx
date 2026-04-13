import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { useWallet } from '../hooks/useWallet';

export function ConnectWalletButton() {
  const { connect } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connect();
    } catch (e) {
      // User cancelled or wallet not found — silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleConnect}
      loading={loading}
      disabled={loading}
      style={styles.button}
      labelStyle={styles.label}
      buttonColor={Colors.accent}
      textColor="#fff"
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 200,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
