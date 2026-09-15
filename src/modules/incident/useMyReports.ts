import { useInfiniteQuery } from "@tanstack/react-query";

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
