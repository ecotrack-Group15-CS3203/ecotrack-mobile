import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { useMembershipWatch } from "../auth/membershipWatch";
import { useMe } from "../auth/useMe";
import { syncCachesForPush } from "./notificationCacheSync";

/**
 * Keeps the cached `/auth/me` row — and therefore which app the user is
 * looking at, citizen or volunteer — in step with membership decisions made
 * elsewhere (an org admin approving a join request in the web console).
 *
 * Mounted once, in NavigationShell, next to the tap listener. Three paths,
 * because no single one is reliable on its own:
 *
 * 1. this listener — a push that lands while the app is foregrounded;
 * 2. useNotificationTapListener — a push tapped from the tray, which never
 *    reaches the listener above;
 * 3. `useMe`'s poll-while-awaiting and refetch-on-focus, for when no push is
 *    delivered at all.
 */
export function useMembershipSync(): void {
  const { data: me } = useMe();
  const awaitingSince = useMembershipWatch((state) => state.awaitingSince);
  const stopWatching = useMembershipWatch((state) => state.stop);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      syncCachesForPush(notification.request.content.data);
    });
    return () => subscription.remove();
  }, []);

  // The wait is over once the server actually reports a membership, whichever
  // of the three paths above surfaced it.
  useEffect(() => {
    if (awaitingSince !== null && me?.organisation) {
      stopWatching();
    }
  }, [awaitingSince, me?.organisation, stopWatching]);
}
