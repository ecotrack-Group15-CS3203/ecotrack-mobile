import { apiClient } from "../../../services/apiClient";
import type { Notification, Paginated } from "../../../types/api";

export const notificationsApi = {
  async getInbox(page: number, limit: number): Promise<Paginated<Notification>> {
    const { data } = await apiClient.get<Paginated<Notification>>("/notifications", {
      params: { page, limit },
    });
    return data;
  },

  async markRead(notificationId: string): Promise<Notification> {
    const { data } = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return data;
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },
};
