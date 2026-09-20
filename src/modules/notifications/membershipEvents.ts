import type { NotificationType } from "../../types/api";

/**
 * Which pushes mean "this user's organisation membership just changed on the
 * server, so the cached /auth/me row is now a lie".
 *
 * Values are the `type` the API puts in every push's data payload
 * (`NotificationType` in ecotrack-api's common/enums/notification.enum.ts —
 * pushIfEligible() sends `{type, relatedEntityType, relatedEntityId}`).
 *
 * This matters because the whole app's shape is derived from
 * `useMe().organisation`: the MyTasks/MyEvents tabs, the org-scoped query keys,
 * the "join an organisation" empty states. Without this, an approved volunteer
 * kept seeing the citizen view — the approval notification arrived, but nothing
 * told TanStack Query that ['me'] was stale, so the app went on rendering the
 * membership it had cached before the approval.
 */
const MEMBERSHIP_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "join_request_approved",
  "join_request_rejected",
  "volunteer_removed",
];

/** Widened to `string` for lookup: the value off a push payload is untyped. */
const MEMBERSHIP_TYPE_LOOKUP = new Set<string>(MEMBERSHIP_NOTIFICATION_TYPES);

/** `data` comes off a push payload, so every field is `unknown` until checked. */
export function affectsMembership(data: Record<string, unknown> | undefined): boolean {
  const type = data?.type;
  return typeof type === "string" && MEMBERSHIP_TYPE_LOOKUP.has(type);
}
