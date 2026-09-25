import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import './src/i18n';
import './src/modules/map/mapboxConfig';
import './src/modules/notifications/notificationHandler';
import { NavigationShell } from './src/navigation/NavigationShell';
import { queryClient, queryPersister } from './src/services/queryClient';

// Hold the native splash until the brand fonts are in, so the first JS frame
// (BootScreen) already has the Montserrat wordmark rather than flashing the
// system font. Must run at module scope, not inside a component.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Montserrat_500Medium, Montserrat_600SemiBold });
  // A font failure shouldn't brick the app: carry on with the system font.
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <NavigationShell />
      <StatusBar style="auto" />
    </PersistQueryClientProvider>
  );
}
