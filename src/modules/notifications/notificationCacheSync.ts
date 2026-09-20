import { queryClient } from "../../services/queryClient";
import { useMembershipWatch } from "../auth/membershipWatch";
import { meQueryKey } from "../auth/useMe";
import { affectsMembership } from "./membershipEvents";
import { inboxQueryKey } from "./useNotifications";

/**
 * Brings the query cache in line with a push that just arrived, whether it was
 * received in the foreground or tapped from the tray.
 *
 * Uses the `queryClient` singleton rather than `useQueryClient()` so the
 * cold-start tap path — which runs from a listener, not from inside a
 * component — can call exactly the same code as the foreground one.
 */
export function syncCachesForPush(data: Record<string, unknown> | undefined): void {
  // The badge and the inbox list are stale the moment anything arrives,
  // whatever it was about.
  queryClient.invalidateQueries({ queryKey: inboxQueryKey });

  if (!affectsMembership(data)) return;

  // The membership the whole navigation shell is derived from just changed
  // server-side. Invalidating ['me'] re-renders MainTabs with the volunteer
  // tabs, and every org-scoped query keyed on `me.organisation.id` refetches
  // behind it (see useTasks/useEvents).
  queryClient.invalidateQueries({ queryKey: meQueryKey });

  // A rejection ends the wait as surely as an approval does; approval clears
  // the watch in useMembershipSync once the fresh row actually shows the
  // membership, so a failed refetch keeps polling instead of giving up.
  if (data?.type === "join_request_rejected") {
    useMembershipWatch.getState().stop();
  }
}
