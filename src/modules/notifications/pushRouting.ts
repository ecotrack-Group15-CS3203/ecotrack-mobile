import { navigate, navigationRef } from "../../navigation/navigationRef";

/** Matches the `data` payload ecotrack-api's pushIfEligible() sends with
 * every push (notifications.service.ts) — {type, relatedEntityType,
 * relatedEntityId}. Not every relatedEntityType has a mobile detail screen
 * (join_request is admin/web-only; organisation has none) — those fall
 * through to the inbox instead of a screen that doesn't exist. */
export function routeFromPushData(data: Record<string, unknown> | undefined): void {
  if (!navigationRef.isReady()) return;

  const relatedEntityType = data?.relatedEntityType;
  const relatedEntityId = data?.relatedEntityId;

  if (typeof relatedEntityId !== "string") {
    navigate("NotificationInbox");
    return;
  }

  switch (relatedEntityType) {
    case "incident":
      navigate("IncidentDetail", { incidentId: relatedEntityId });
      return;
    case "task":
      navigate("TaskDetail", { taskId: relatedEntityId });
      return;
    case "event":
      navigate("EventDetail", { eventId: relatedEntityId });
      return;
    default:
      navigate("NotificationInbox");
  }
}
