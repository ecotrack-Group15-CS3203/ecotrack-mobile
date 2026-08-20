import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

import { useIncidentStore } from "./incidentStore";

/**
 * Retries queued incident drafts whenever connectivity transitions from
 * disconnected to connected, and once on mount in case drafts were left
 * over from a previous session while already online.
 */
export function useNetworkQueueSync() {
  const processQueue = useIncidentStore((state) => state.processQueue);
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    void processQueue();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = !!state.isConnected;
      if (isConnected && wasConnected.current === false) {
        void processQueue();
      }
      wasConnected.current = isConnected;
    });

    return unsubscribe;
  }, [processQueue]);
}
