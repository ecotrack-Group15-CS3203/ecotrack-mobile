import { apiClient } from "../../../services/apiClient";
import type { Paginated, Task } from "../../../types/api";

export type TaskView = "assigned" | "in_progress" | "completed" | "declined" | "upcoming";

export const tasksApi = {
  /**
   * organisationId is a required path segment (the controller is nested under
   * `organisations/:organisationId/tasks`) but the backend actually resolves
   * "mine" from the caller's own id, not this param — it's still needed here
   * purely to construct a valid URL, so callers must pass the caller's own
   * `useMe().organisation.id`.
   */
  async getMine(
    organisationId: string,
    view: TaskView | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<Task>> {
    const { data } = await apiClient.get<Paginated<Task>>(
      `/organisations/${organisationId}/tasks/mine`,
      { params: { view, page, limit } },
    );
    return data;
  },

  async getById(organisationId: string, taskId: string): Promise<Task> {
    const { data } = await apiClient.get<Task>(`/organisations/${organisationId}/tasks/${taskId}`);
    return data;
  },

  async respondToAssignment(
    organisationId: string,
    taskId: string,
    accept: boolean,
    reason?: string,
  ): Promise<Task> {
    const { data } = await apiClient.patch<Task>(
      `/organisations/${organisationId}/tasks/${taskId}/assignments/respond`,
      { accept, reason },
    );
    return data;
  },

  async startProgress(organisationId: string, taskId: string): Promise<Task> {
    const { data } = await apiClient.patch<Task>(
      `/organisations/${organisationId}/tasks/${taskId}/progress/start`,
    );
    return data;
  },

  async addNote(organisationId: string, taskId: string, note: string): Promise<Task> {
    const { data } = await apiClient.post<Task>(
      `/organisations/${organisationId}/tasks/${taskId}/progress/notes`,
      { note },
    );
    return data;
  },

  async addPhotos(organisationId: string, taskId: string, mediaUrls: string[]): Promise<Task> {
    const { data } = await apiClient.post<Task>(
      `/organisations/${organisationId}/tasks/${taskId}/progress/photos`,
      { mediaUrls },
    );
    return data;
  },

  async complete(organisationId: string, taskId: string): Promise<Task> {
    const { data } = await apiClient.patch<Task>(
      `/organisations/${organisationId}/tasks/${taskId}/progress/complete`,
    );
    return data;
  },
};
