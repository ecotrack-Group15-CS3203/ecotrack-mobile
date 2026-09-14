import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "./authStore";
import { authApi, UpdateProfilePayload } from "./api/auth.api";

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
