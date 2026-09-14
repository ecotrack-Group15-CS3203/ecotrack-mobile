import { apiClient } from "../../../services/apiClient";
import type { IncidentSeverity, Me } from "../../../types/api";

export interface UpdateProfilePayload {
  fullName?: string;
  notificationRadiusMeters?: number;
  notificationMinUrgency?: IncidentSeverity;
  alertCenter?: { lat: number; lng: number };
}

export const authApi = {
  async getMe(): Promise<Me> {
    const { data } = await apiClient.get<Me>("/auth/me");
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<Me> {
    const { data } = await apiClient.patch<Me>("/auth/me", payload);
    return data;
  },

  async registerPushToken(pushToken: string): Promise<void> {
    await apiClient.patch("/auth/push-token", { pushToken });
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete("/auth/me");
  },
};
