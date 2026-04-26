import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { colors, radii, typography } from '../theme';
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
      buttonColor={colors.accent}
      textColor={colors.onAccent}
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    paddingVertical: 4,
    minWidth: 200,
  },
  label: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
  },
});
