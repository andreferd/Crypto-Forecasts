// Polyfills
import './src/polyfills';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { WalletProvider } from './src/hooks/useWallet';
import { OnboardingProvider } from './src/hooks/useOnboarding';
import { AppNavigator } from './src/navigation/AppNavigator';
import { paperTheme } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

export default function App() {
  // Load Inter in the background. We do NOT gate render on this —
  // if the font load stalls or fails, the app still shows (system fonts
  // fall back automatically). Inter swaps in when ready.
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <OnboardingProvider>
            <WalletProvider>
              <AppNavigator />
            </WalletProvider>
          </OnboardingProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
