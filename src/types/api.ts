/**
 * Hand-mirrored DTOs matching ecotrack-api's response bodies. No shared
 * `@ecotrack/types` package exists across the three repos (SAD §8.1) — this is
 * expected drift, not a bug. Re-check against the real API whenever
 * ecotrack-api's endpoints change shape.
 */

export type UserRole = "citizen" | "volunteer" | "org_admin";

export type IncidentCategory =
  | "illegal_dumping"
  | "water_pollution"
  | "air_pollution"
  | "deforestation"
  | "wildlife_hazard"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type VerificationStatus = "approved" | "rejected" | "duplicate";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type AssignmentStatus = "assigned" | "accepted" | "declined" | "cancelled";

export type EventStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export type NotificationType =
  | "task_assigned"
  | "incident_claimed"
  | "incident_rejected"
  | "task_status_changed"
  | "cleanup_scheduled"
  | "task_completed"
  | "join_request_submitted"
  | "join_request_approved"
  | "join_request_rejected"
  | "event_cancelled"
  | "incident_proximity"
  | "task_due_reminder"
  | "event_reminder"
  | "volunteer_removed";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationPreferences {
  taskAssigned: boolean;
  scheduleChanged: boolean;
  cleanupScheduled: boolean;
}

/** GET /v1/auth/me */
export interface Me {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  notificationPreferences: NotificationPreferences;
  notificationRadiusMeters: number;
  notificationMinUrgency: IncidentSeverity;
  /** Never the raw coordinates — the API only ever reports whether one has been
   * captured, not where it is. */
  alertCenterSet: boolean;
  organisation: { id: string; name: string; isActive: boolean } | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** GET /v1/incidents/nearby row — a reduced, cross-tenant-safe projection.
 * No description, address, reporter, or organisation id. */
export interface NearbyIncident {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  createdAt: string;
  claimed: boolean;
  lat: number;
  lng: number;
  distanceMeters: number;
  thumbnailUrl: string | null;
}

/** GET /v1/incidents/:id when the caller has no membership in the reporting
 * org — same reduced-visibility idea as NearbyIncident, one row instead of a
 * list, with `description`/`address` included (a single detail view is a much
 * smaller data-exposure surface than a bulk list). */
export interface PublicIncidentDetail {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  address: string | null;
  createdAt: string;
  claimed: boolean;
  lat: number;
  lng: number;
  images: { id: string; url: string }[];
  visibility: "public";
}

/** GET /v1/incidents/:id when the caller can see the full row (their own
 * report, their org's claimed incident, or a platform admin). */
export interface FullIncidentDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string | null;
  reportedByUserId: string | null;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  location: GeoPoint;
  address: string | null;
  verificationStatus: VerificationStatus | null;
  currentStageId: string | null;
  rejectionReason: string | null;
  duplicateOfId: string | null;
  claimedByUserId: string | null;
  claimedAt: string | null;
  version: number;
  images: { id: string; url: string }[];
  visibility: "full";
}

export type IncidentDetail = FullIncidentDetail | PublicIncidentDetail;

/** GET /v1/incidents/mine row (Paginated) */
export interface MyIncident {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string | null;
  reportedByUserId: string | null;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  location: GeoPoint;
  address: string | null;
  verificationStatus: VerificationStatus | null;
  currentStageId: string | null;
  rejectionReason: string | null;
  duplicateOfId: string | null;
  claimedByUserId: string | null;
  claimedAt: string | null;
  version: number;
  images: { id: string; url: string }[];
}

export interface TaskAssignment {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  taskId: string;
  volunteerUserId: string;
  status: AssignmentStatus;
  respondedAt: string | null;
  declineReason: string | null;
  volunteer: { id: string; fullName: string; email: string } | null;
}

export interface TaskNote {
  id: string;
  taskId: string;
  authorUserId: string | null;
  note: string;
  createdAt: string;
}

export interface TaskPhoto {
  id: string;
  taskId: string;
  uploadedByUserId: string | null;
  url: string;
  createdAt: string;
}

/** GET /v1/organisations/:id/tasks/:id, and the item shape inside every
 * paginated tasks list. */
export interface Task {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  incidentId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdByUserId: string | null;
  assignments: TaskAssignment[];
  notes: TaskNote[];
  photos: TaskPhoto[];
}

export interface EventIncidentSummary {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
}

export interface EventRsvp {
  userId: string;
  rsvpedAt: string;
  user: { id: string; fullName: string; email: string } | null;
}

/** GET /v1/organisations/:id/events/:id, and the item shape inside the
 * paginated events list (list rows omit `incidents`/`rsvps` — see
 * events.api.ts's two response types). */
export interface EventDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  title: string;
  description: string | null;
  location: GeoPoint;
  scheduledAt: string;
  endsAt: string;
  maxAttendees: number | null;
  status: EventStatus;
  rsvpCount: number;
  createdByUserId: string | null;
  incidents: EventIncidentSummary[];
  rsvps: EventRsvp[];
}

export interface EventListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  title: string;
  description: string | null;
  location: GeoPoint;
  scheduledAt: string;
  endsAt: string;
  maxAttendees: number | null;
  status: EventStatus;
  rsvpCount: number;
  createdByUserId: string | null;
  rsvpedByMe: boolean;
}

/** GET /v1/organisations/public row */
export interface PublicOrganisation {
  id: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  serviceAreaRadiusKm: number;
  distanceMeters: number | null;
  eligible: boolean | null;
}

export interface Notification {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organisationId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
}

/** GET /v1/invites/:token — the shareable invite-LINK model (org_admin
 * generates a reusable link with an optional max-uses cap), not the single-use
 * email invitation. Three independent boolean flags rather than one status
 * enum because the accept screen needs to show each reason distinctly. */
export interface InviteLinkInfo {
  organisationName: string;
  expired: boolean;
  revoked: boolean;
  exhausted: boolean;
}

/** POST /v1/organisations/invites/accept */
export interface AcceptInviteLinkResult {
  organisationId: string;
  role: UserRole;
}
