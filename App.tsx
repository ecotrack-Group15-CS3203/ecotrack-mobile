import { StatusBar } from 'expo-status-bar';

import './src/i18n';
import { NavigationShell } from './src/navigation/NavigationShell';

export default function App() {
  return (
    <>
      <NavigationShell />
      <StatusBar style="auto" />
    </>
  );
}
