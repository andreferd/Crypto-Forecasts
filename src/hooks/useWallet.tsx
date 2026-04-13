import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useAuthorization, Account } from '../utils/useAuthorization';
import { useMobileWallet } from '../utils/useMobileWallet';

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  selectedAccount: Account | null;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  selectedAccount: null,
  isLoading: true,
  connect: async () => {},
  disconnect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { selectedAccount, isLoading } = useAuthorization();
  const { connect: mwaConnect, disconnect: mwaDisconnect } = useMobileWallet();

  const connect = useCallback(async () => {
    await mwaConnect();
  }, [mwaConnect]);

  const disconnect = useCallback(async () => {
    await mwaDisconnect();
  }, [mwaDisconnect]);

  const value = useMemo<WalletContextType>(
    () => ({
      connected: selectedAccount != null,
      publicKey: selectedAccount?.publicKey?.toBase58() ?? null,
      selectedAccount,
      isLoading,
      connect,
      disconnect,
    }),
    [selectedAccount, isLoading, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
