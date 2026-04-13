// Polyfills
import './src/polyfills';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { Colors } from './src/constants/colors';
import { WalletProvider } from './src/hooks/useWallet';
import { AppNavigator } from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: Colors.background,
    surface: Colors.surface,
    primary: Colors.accent,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
  },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={darkTheme}>
        <SafeAreaProvider>
          <WalletProvider>
            <AppNavigator />
          </WalletProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
