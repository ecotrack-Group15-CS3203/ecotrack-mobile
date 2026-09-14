import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import './src/i18n';
import './src/modules/map/mapboxConfig';
import { NavigationShell } from './src/navigation/NavigationShell';
import { queryClient, queryPersister } from './src/services/queryClient';

export default function App() {
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
