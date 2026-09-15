import { useQuery } from "@tanstack/react-query";

import { incidentsApi } from "./api/incidents.api";

/** Rounded so a few metres of GPS jitter doesn't mint a new query key (and
 * therefore a new network request) on every render. */
function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function useNearbyIncidents(
  lat: number | null,
  lng: number | null,
  radiusMeters: number,
) {
  const roundedLat = lat !== null ? roundCoord(lat) : null;
  const roundedLng = lng !== null ? roundCoord(lng) : null;

  return useQuery({
    queryKey: ["incidents", "nearby", roundedLat, roundedLng, radiusMeters],
    queryFn: () => incidentsApi.getNearby(roundedLat!, roundedLng!, radiusMeters),
    enabled: roundedLat !== null && roundedLng !== null,
    // A pin appearing a few seconds late is fine; a stale claimed/unclaimed
    // badge is the kind of thing users notice, so keep this shorter than the
    // 5-minute default elsewhere.
    staleTime: 30_000,
  });
}

export function useIncidentDetail(incidentId: string) {
  return useQuery({
    queryKey: ["incidents", "detail", incidentId],
    queryFn: () => incidentsApi.getById(incidentId),
  });
}
