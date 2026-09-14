import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../modules/auth/authStore";
import { useNetworkQueueSync } from "../modules/incident/useNetworkQueueSync";
import { navigationRef } from "./navigationRef";
import { AuthStack } from "./AuthStack";
import { RootStack } from "./RootStack";

export function NavigationShell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useNetworkQueueSync();

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        {isAuthenticated ? <RootStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
