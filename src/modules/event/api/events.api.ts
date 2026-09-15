import { apiClient } from "../../../services/apiClient";
import type { EventDetail, EventListItem, EventStatus, Paginated } from "../../../types/api";

export const eventsApi = {
  async getForOrganisation(
    organisationId: string,
    status: EventStatus | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<EventListItem>> {
    const { data } = await apiClient.get<Paginated<EventListItem>>(
      `/organisations/${organisationId}/events`,
      { params: { status, page, limit } },
    );
    return data;
  },

  async getById(organisationId: string, eventId: string): Promise<EventDetail> {
    const { data } = await apiClient.get<EventDetail>(
      `/organisations/${organisationId}/events/${eventId}`,
    );
    return data;
  },

  async rsvp(organisationId: string, eventId: string): Promise<EventDetail> {
    const { data } = await apiClient.post<EventDetail>(
      `/organisations/${organisationId}/events/${eventId}/rsvp`,
    );
    return data;
  },

  async cancelRsvp(organisationId: string, eventId: string): Promise<EventDetail> {
    const { data } = await apiClient.delete<EventDetail>(
      `/organisations/${organisationId}/events/${eventId}/rsvp`,
    );
    return data;
  },
};
