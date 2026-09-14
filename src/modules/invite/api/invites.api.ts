import { apiClient } from "../../../services/apiClient";
import type { AcceptInviteLinkResult, InviteLinkInfo } from "../../../types/api";

export const invitesApi = {
  async getInfo(token: string): Promise<InviteLinkInfo> {
    const { data } = await apiClient.get<InviteLinkInfo>(`/invites/${encodeURIComponent(token)}`);
    return data;
  },

  async accept(token: string, lat: number, lng: number): Promise<AcceptInviteLinkResult> {
    const { data } = await apiClient.post<AcceptInviteLinkResult>("/organisations/invites/accept", {
      token,
      lat,
      lng,
    });
    return data;
  },
};
