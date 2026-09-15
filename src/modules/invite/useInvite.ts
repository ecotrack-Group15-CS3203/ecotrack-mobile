import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { meQueryKey } from "../auth/useMe";
import { invitesApi } from "./api/invites.api";

export function useInviteInfo(token: string) {
  return useQuery({
    queryKey: ["invites", token],
    queryFn: () => invitesApi.getInfo(token),
    // A rate-limited, token-guessable public lookup (SRS §3.4.11) — no point
    // retrying a 404/expired result, and no point refetching a still-open screen.
    retry: false,
    staleTime: Infinity,
  });
}

export function useAcceptInvite(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (coordinate: { lat: number; lng: number }) =>
      invitesApi.accept(token, coordinate.lat, coordinate.lng),
    onSuccess: () => {
      // Membership just changed — every screen gating on useMe().organisation
      // (MyTasks/MyEvents tab visibility, this screen's own caller) needs the
      // fresh row, not the pre-accept snapshot.
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
