import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { syncCachesForPush } from "./notificationCacheSync";
import { routeFromPushData } from "./pushRouting";

/** Cold-start tap (app was killed) + warm-state tap, both routed through the
 * same handler — mirrors useDeepLinkListener's getInitialURL/addEventListener
 * pairing for the same reason: a tap that launched the app needs the same
 * outcome as one received while already open.
 *
 * Both also run the cache sync first: a notification delivered while the app
 * was backgrounded never reaches the foreground listener in useMembershipSync,
 * so this is the only chance to notice that a membership changed before the
 * user lands on a screen still rendering the old one. */
export function useNotificationTapListener() {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        syncCachesForPush(response.notification.request.content.data);
        routeFromPushData(response.notification.request.content.data);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      syncCachesForPush(response.notification.request.content.data);
      routeFromPushData(response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, []);
}
