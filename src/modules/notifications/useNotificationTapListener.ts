import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { routeFromPushData } from "./pushRouting";

/** Cold-start tap (app was killed) + warm-state tap, both routed through the
 * same handler — mirrors useDeepLinkListener's getInitialURL/addEventListener
 * pairing for the same reason: a tap that launched the app needs the same
 * outcome as one received while already open. */
export function useNotificationTapListener() {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        routeFromPushData(response.notification.request.content.data);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromPushData(response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, []);
}
