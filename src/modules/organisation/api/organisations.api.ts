import { apiClient } from "../../../services/apiClient";
import type { Paginated, PublicOrganisation } from "../../../types/api";

export interface SubmitJoinRequestPayload {
  organisationId: string;
  lat: number;
  lng: number;
  message?: string;
}

export const organisationsApi = {
  async searchPublic(
    q: string | undefined,
    coordinate: { lat: number; lng: number } | null,
    page: number,
    limit: number,
  ): Promise<Paginated<PublicOrganisation>> {
    const { data } = await apiClient.get<Paginated<PublicOrganisation>>("/organisations/public", {
      params: {
        q: q || undefined,
        lat: coordinate?.lat,
        lng: coordinate?.lng,
        page,
        limit,
      },
    });
    return data;
  },

  async submitJoinRequest(payload: SubmitJoinRequestPayload): Promise<{ id: string; status: string }> {
    const { data } = await apiClient.post<{ id: string; status: string }>(
      "/organisations/join-request",
      payload,
    );
    return data;
  },
};
