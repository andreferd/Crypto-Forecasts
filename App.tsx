// Polyfills
import './src/polyfills';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
// Subpath imports skip the barrel that eagerly require()'s all 18 weights.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// Kick off the MCI font load at module load time, before any Icon mounts.
// The createIconSet auto-load via componentDidMount can race first paint on
// Expo 52 / new-arch cold launch, leaving icons as empty <Text/>.
MaterialCommunityIcons.loadFont().catch((err) => {
  console.warn('[App] MaterialCommunityIcons.loadFont failed:', err);
});
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
