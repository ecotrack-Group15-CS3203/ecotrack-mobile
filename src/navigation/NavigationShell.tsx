import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../modules/auth/authStore";
import { useNetworkQueueSync } from "../modules/incident/useNetworkQueueSync";
import { navigate, navigationRef } from "./navigationRef";
import { pendingLink } from "./pendingLink";
import { useDeepLinkListener } from "./useDeepLinkListener";
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
  useDeepLinkListener();

  // Replays a link that arrived pre-login (see useDeepLinkListener/pendingLink)
  // once sign-in flips this true and RootStack has had a chance to mount under
  // the ref. RootStack renders in the same pass as this effect's dependency
  // change, but the ref's readiness is set slightly after commit, hence the
  // one-frame retry rather than assuming it's already ready.
  useEffect(() => {
    if (!isAuthenticated) return;
    const target = pendingLink.consume();
    if (!target) return;

    if (navigationRef.isReady()) {
      navigate(target.route, target.params);
    } else {
      requestAnimationFrame(() => navigate(target.route, target.params));
    }
  }, [isAuthenticated]);

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
