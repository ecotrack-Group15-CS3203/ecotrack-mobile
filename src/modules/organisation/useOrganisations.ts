import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { meQueryKey } from "../auth/useMe";
import { organisationsApi, SubmitJoinRequestPayload } from "./api/organisations.api";

const PAGE_SIZE = 20;

export function useOrganisationDirectory(q: string, coordinate: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ["organisations", "public", q, coordinate?.lat, coordinate?.lng],
    queryFn: () => organisationsApi.searchPublic(q, coordinate, 1, PAGE_SIZE),
    staleTime: 60_000,
  });
}

export function useSubmitJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitJoinRequestPayload) => organisationsApi.submitJoinRequest(payload),
    onSuccess: () => {
      // A pending join request doesn't change membership yet (an admin still
      // has to approve it), but useMe() is cheap enough to just refresh in
      // case anything about the caller's row changed server-side.
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
