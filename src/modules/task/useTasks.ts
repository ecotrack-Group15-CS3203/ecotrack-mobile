import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useMe } from "../auth/useMe";
import { tasksApi, TaskView } from "./api/tasks.api";

const PAGE_SIZE = 20;

export function useMyTasks(view?: TaskView) {
  const { data: me } = useMe();
  const organisationId = me?.organisation?.id;

  return useQuery({
    queryKey: ["tasks", "mine", organisationId, view],
    queryFn: () => tasksApi.getMine(organisationId!, view, 1, PAGE_SIZE),
    enabled: !!organisationId,
  });
}

export function useTaskDetail(organisationId: string | undefined, taskId: string) {
  return useQuery({
    queryKey: ["tasks", "detail", organisationId, taskId],
    queryFn: () => tasksApi.getById(organisationId!, taskId),
    enabled: !!organisationId,
  });
}

/** Every task mutation invalidates both the list (badge/status changes show
 * there too) and this task's own detail query on success. */
function invalidateTaskQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organisationId: string | undefined,
  taskId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["tasks", "detail", organisationId, taskId] });
  queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] });
}

export function useRespondToAssignment(organisationId: string | undefined, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accept, reason }: { accept: boolean; reason?: string }) =>
      tasksApi.respondToAssignment(organisationId!, taskId, accept, reason),
    onSuccess: () => invalidateTaskQueries(queryClient, organisationId, taskId),
  });
}

export function useStartTask(organisationId: string | undefined, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tasksApi.startProgress(organisationId!, taskId),
    onSuccess: () => invalidateTaskQueries(queryClient, organisationId, taskId),
  });
}

export function useAddTaskNote(organisationId: string | undefined, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => tasksApi.addNote(organisationId!, taskId, note),
    onSuccess: () => invalidateTaskQueries(queryClient, organisationId, taskId),
  });
}

export function useAddTaskPhotos(organisationId: string | undefined, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaUrls: string[]) => tasksApi.addPhotos(organisationId!, taskId, mediaUrls),
    onSuccess: () => invalidateTaskQueries(queryClient, organisationId, taskId),
  });
}

export function useCompleteTask(organisationId: string | undefined, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tasksApi.complete(organisationId!, taskId),
    onSuccess: () => invalidateTaskQueries(queryClient, organisationId, taskId),
  });
}
