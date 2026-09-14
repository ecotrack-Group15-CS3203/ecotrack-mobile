import { AppState, AppStateStatus, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { createMMKV } from "react-native-mmkv";

/**
 * Binds TanStack Query's connectivity/focus signals to the same sources
 * useNetworkQueueSync already uses (NetInfo, AppState), rather than the
 * browser-oriented `navigator.onLine`/`visibilitychange` defaults, which don't
 * exist in React Native and would leave onlineManager permanently "online."
 */
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

AppState.addEventListener("change", onAppStateChange);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A cache read is still useful past its staleTime while offline or
      // between app opens — refetchOnReconnect/refetchOnMount (both default
      // true) cover getting fresh data back once connectivity returns.
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
    mutations: {
      retry: 0,
    },
  },
});

const mmkvStorage = createMMKV({ id: "ecotrack.query-cache" });

/** react-native-mmkv is synchronous, so this adapter needs no async wrapper —
 * unlike AsyncStorage-backed persisters elsewhere in the TanStack ecosystem. */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => mmkvStorage.getString(key) ?? null,
    setItem: (key, value) => mmkvStorage.set(key, value),
    removeItem: (key) => mmkvStorage.remove(key),
  },
});
