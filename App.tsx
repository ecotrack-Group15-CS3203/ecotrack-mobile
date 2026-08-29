import { StatusBar } from 'expo-status-bar';

import './src/i18n';
import './src/modules/map/mapboxConfig';
import { NavigationShell } from './src/navigation/NavigationShell';

export default function App() {
  return (
    <>
      <NavigationShell />
      <StatusBar style="auto" />
    </>
  );
}
