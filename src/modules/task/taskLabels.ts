import type { Task, TaskAssignment } from "../../types/api";

/**
 * The calling volunteer's own assignment on a task. The API keeps historical
 * assignments (declined and cancelled rows survive reassignment), so
 * `assignments[0]` can belong to a previous assignee — matching on the user id is
 * the only reliable way. Falls back to the first row when no id is known, which is
 * right for the common case of a task that has only ever had one assignee.
 */
export function myAssignment(task: Task, userId?: string): TaskAssignment | undefined {
  return (userId ? task.assignments.find((a) => a.volunteerUserId === userId) : undefined) ?? task.assignments[0];
}

/**
 * A task's user-facing status is really a combination of task.status and the
 * calling volunteer's own assignment.status — "pending" alone doesn't distinguish
 * "just assigned, awaiting my response" from "I accepted, haven't started yet".
 */
type TaskStatusName = "completed" | "in_progress" | "assigned" | "accepted" | "declined" | "pending";

function taskStatusName(task: Task, userId?: string): TaskStatusName {
  if (task.status === "completed") return "completed";
  if (task.status === "in_progress") return "in_progress";

  const assignment = myAssignment(task, userId);
  if (assignment?.status === "assigned") return "assigned";
  if (assignment?.status === "accepted") return "accepted";
  if (assignment?.status === "declined") return "declined";
  return "pending";
}

const STATUS_KEY = {
  completed: "tasks.status.completed",
  in_progress: "tasks.status.inProgress",
  assigned: "tasks.status.awaitingResponse",
  accepted: "tasks.status.accepted",
  declined: "tasks.status.declined",
  pending: "tasks.status.pending",
} as const;

/** i18n key for the status label — resolved with `t()` at render (SRS §3.5.8). */
export function taskStatusKey(task: Task, userId?: string) {
  return STATUS_KEY[taskStatusName(task, userId)];
}

/**
 * The status name behind that label, for `statusTone()` — the same pairing the web
 * uses (`<Chip tone={...}>`), so "in progress" is the same indigo on both clients.
 * Derived from the same function as the key so the two can't drift apart.
 */
export function taskStatusTone(task: Task, userId?: string): string {
  return taskStatusName(task, userId);
}
