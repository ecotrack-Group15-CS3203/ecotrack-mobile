import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { incidentsApi } from "./api/incidents.api";

const PAGE_SIZE = 20;

export function useMyReports() {
  return useInfiniteQuery({
    queryKey: ["incidents", "mine"],
    queryFn: ({ pageParam }) => incidentsApi.getMine(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  });
}

/**
 * How many reports this user has filed — the server's own `total`, read from a
 * one-row page rather than fetching the list. Mounted only by the Profile screen,
 * never prefetched at launch (SRS §3.4.3's 3 s cold-start budget).
 *
 * Under the ["incidents", "mine"] prefix so anything that invalidates the user's
 * reports refreshes this too.
 */
export function useMyReportCount() {
  return useQuery({
    queryKey: ["incidents", "mine", "count"],
    queryFn: async () => (await incidentsApi.getMine(1, 1)).total,
    staleTime: 5 * 60_000,
  });
}
