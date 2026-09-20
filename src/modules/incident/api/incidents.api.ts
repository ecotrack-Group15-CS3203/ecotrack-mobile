import { apiClient } from "../../../services/apiClient";
import type { IncidentDetail, MyIncident, NearbyIncident, Paginated } from "../../../types/api";

export interface CreateIncidentPayload {
  title: string;
  description: string;
  location: { lat: number; lng: number };
  urgency: "low" | "medium" | "high" | "critical";
  mediaUrls: string[];
}

export const incidentsApi = {
  async create(payload: CreateIncidentPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post<{ id: string }>("/incidents", payload);
    return data;
  },

  async getNearby(lat: number, lng: number, radiusMeters: number): Promise<NearbyIncident[]> {
    const { data } = await apiClient.get<NearbyIncident[]>("/incidents/nearby", {
      params: { lat, lng, radius: radiusMeters },
    });
    return data;
  },

  async getById(incidentId: string): Promise<IncidentDetail> {
    const { data } = await apiClient.get<IncidentDetail>(`/incidents/${incidentId}`);
    return data;
  },

  async getMine(page: number, limit: number): Promise<Paginated<MyIncident>> {
    const { data } = await apiClient.get<Paginated<MyIncident>>("/incidents/mine", {
      params: { page, limit },
    });
    return data;
  },
};
