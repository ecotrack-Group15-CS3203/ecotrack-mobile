import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { useIncidentStore } from "./incidentStore";

/**
 * Sends queued incident drafts at the moments something has plausibly changed:
 * once on mount (drafts left over from a previous session), whenever
 * connectivity goes from disconnected to connected, and whenever the app comes
 * back to the foreground.
 *
 * The foreground trigger exists because the store's backoff timer doesn't tick
 * while the app is suspended — without it, a report that failed and was then
 * left overnight would wait for a network transition that never comes on a phone
 * that stayed on wifi. While the app *is* open and online, the store's own
 * backoff timer does the retrying (see scheduleRetry in incidentStore).
 */
export function useNetworkQueueSync() {
  const processQueue = useIncidentStore((state) => state.processQueue);
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    void processQueue();

    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      const isConnected = !!state.isConnected;
      if (isConnected && wasConnected.current === false) {
        void processQueue();
      }
      wasConnected.current = isConnected;
    });

    const appStateSubscription = AppState.addEventListener("change", (status) => {
      if (status === "active") void processQueue();
    });

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, [processQueue]);
}
