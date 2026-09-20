import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "./authStore";
import { isWithinWatchWindow, useMembershipWatch } from "./membershipWatch";
import { authApi, UpdateProfilePayload } from "./api/auth.api";

/** How often to re-check membership while a join request is outstanding. Short
 * enough that an approval shows up while the user is still looking at the
 * screen, and it only runs while a request is actually pending and the app is
 * foregrounded (TanStack Query pauses intervals in the background). */
const AWAITING_MEMBERSHIP_POLL_MS = 20_000;

export const meQueryKey = ["me"] as const;

/**
 * The source of truth for role/organisation membership — not the JWT claims
 * authStore decodes. The backend resolves both from the `users` table on
 * every request, and almost every org-scoped route is
 * `/organisations/:organisationId/...`; right after an invite-accept or join
 * approval the JWT is stale (it won't reflect the new membership until the
 * next token refresh), while this always reflects the current row.
 */
export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const awaitingSince = useMembershipWatch((state) => state.awaitingSince);
  const isAwaitingMembership = isWithinWatchWindow(awaitingSince);

  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    // Long, because the events that change this row are pushed to us: an
    // approval, rejection or removal invalidates ['me'] on arrival (see
    // notificationCacheSync), as do the mutations this app performs itself
    // (join, invite-accept, profile edit). Between those, a five-minute cache
    // saves a request on every screen focus.
    staleTime: 5 * 60 * 1000,
    // ...but the push is the *fast* path, not a guarantee — it needs a granted
    // permission, a registered token and a delivery that actually lands. These
    // two are the backstop: whatever happened while the app was closed or
    // offline, it re-reads membership the moment it is usable again, so a
    // volunteer approved overnight isn't still shown the citizen view at
    // breakfast. "always" rather than true because the staleTime above would
    // otherwise swallow the refetch.
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    // And while a decision is actually outstanding, check without waiting for
    // the user to background the app and come back.
    refetchInterval: isAwaitingMembership ? AWAITING_MEMBERSHIP_POLL_MS : false,
  });
}

/** authApi.updateProfile already returns the fresh Me row, so the mutation
 * writes it straight into the ['me'] cache instead of issuing a second
 * GET /auth/me right after the PATCH that just returned the same data. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (me) => {
      queryClient.setQueryData(meQueryKey, me);
    },
  });
}
