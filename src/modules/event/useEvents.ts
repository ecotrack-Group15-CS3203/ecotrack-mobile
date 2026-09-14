import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useMe } from "../auth/useMe";
import { eventsApi } from "./api/events.api";
import type { EventStatus } from "../../types/api";

const PAGE_SIZE = 20;

export function useEvents(status?: EventStatus) {
  const { data: me } = useMe();
  const organisationId = me?.organisation?.id;

  return useQuery({
    queryKey: ["events", "list", organisationId, status],
    queryFn: () => eventsApi.getForOrganisation(organisationId!, status, 1, PAGE_SIZE),
    enabled: !!organisationId,
  });
}

export function useEventDetail(organisationId: string | undefined, eventId: string) {
  return useQuery({
    queryKey: ["events", "detail", organisationId, eventId],
    queryFn: () => eventsApi.getById(organisationId!, eventId),
    enabled: !!organisationId,
  });
}

function invalidateEventQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organisationId: string | undefined,
  eventId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["events", "detail", organisationId, eventId] });
  queryClient.invalidateQueries({ queryKey: ["events", "list", organisationId] });
}

export function useRsvp(organisationId: string | undefined, eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.rsvp(organisationId!, eventId),
    onSuccess: () => invalidateEventQueries(queryClient, organisationId, eventId),
  });
}

export function useCancelRsvp(organisationId: string | undefined, eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.cancelRsvp(organisationId!, eventId),
    onSuccess: () => invalidateEventQueries(queryClient, organisationId, eventId),
  });
}
