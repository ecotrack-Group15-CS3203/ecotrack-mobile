import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "./api/notifications.api";

const PAGE_SIZE = 30;
/** Exported so notificationCacheSync can invalidate the inbox from outside
 * the component tree, when a push arrives. */
export const inboxQueryKey = ["notifications", "inbox"] as const;

export function useNotificationInbox() {
  return useQuery({
    queryKey: inboxQueryKey,
    queryFn: () => notificationsApi.getInbox(1, PAGE_SIZE),
    // Notifications should feel current whenever the inbox is opened, not
    // served from a five-minute-old cache like most other list data.
    staleTime: 10_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inboxQueryKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inboxQueryKey }),
  });
}
