import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "./authStore";
import { authApi } from "./api/auth.api";

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

  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    // Membership/role changes only happen through actions this app itself
    // triggers (join, invite-accept, leave) — each of those already
    // invalidates ['me'] explicitly, so a long staleTime here just avoids
    // redundant refetches on every screen focus in between.
    staleTime: 5 * 60 * 1000,
  });
}
