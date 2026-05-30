// Polyfills
import './src/polyfills';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const ONE_DAY = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // gcTime must be >= the persist maxAge below, otherwise a restored
      // query is garbage-collected before its component mounts.
      gcTime: ONE_DAY,
      retry: 2,
    },
  },
});

// Persist the query cache to AsyncStorage so a cold start hydrates instantly
// from the last session instead of waiting ~3-5s on a full refetch. Live data
// still refreshes in the background once mounted (staleTime/refetchInterval).
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@crypto_forecasts_query_cache',
  throttleTime: 2000,
});

// Only persist the heavy, slow-changing queries — those are what make a cold
// start feel slow. Bump the buster string whenever a payload shape changes so
// stale caches from an older app version are discarded on launch.
const PERSISTED_QUERY_KEYS = new Set([
  'kalshi-markets',
  'forecast-history',
  'spot-history',
  'spot-prices',
]);
const CACHE_BUSTER = 'cp-cache-v1';

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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: ONE_DAY,
        buster: CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            PERSISTED_QUERY_KEYS.has(query.queryKey[0] as string),
        },
      }}
    >
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <OnboardingProvider>
            <WalletProvider>
              <AppNavigator />
            </WalletProvider>
          </OnboardingProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}
