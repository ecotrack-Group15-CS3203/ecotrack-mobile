import type { Task } from "../../types/api";

/**
 * A task's user-facing status is really a combination of task.status and the
 * calling volunteer's own assignment.status — "pending" alone doesn't
 * distinguish "just assigned, awaiting my response" from "I accepted, haven't
 * started yet". Assumes exactly one assignment belongs to the viewer, which
 * holds for every screen this is used from (they're all volunteer-scoped
 * views of the volunteer's own tasks).
 */
export function taskStatusLabel(task: Task): string {
  if (task.status === "completed") return "COMPLETED";
  if (task.status === "in_progress") return "IN PROGRESS";

  const assignment = task.assignments[0];
  if (assignment?.status === "assigned") return "AWAITING RESPONSE";
  if (assignment?.status === "accepted") return "ACCEPTED";
  if (assignment?.status === "declined") return "DECLINED";
  return "PENDING";
}
