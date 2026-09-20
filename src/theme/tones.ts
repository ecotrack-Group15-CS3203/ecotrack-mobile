import type { IncidentSeverity } from "../types/api";
import { colors } from "./colors";

/** An ink colour and the tint it is legible on — the pair every status chip,
 * badge and banner draws from. */
export type Tone = {
  ink: string;
  tint: string;
  /** Text colour to use instead of `ink` where `ink` alone falls under WCAG AA
   * (4.5:1) against `tint` at label size. Icons, dots and borders keep `ink`. */
  text?: string;
};

export const tones = {
  pending: { ink: colors.status.pending, tint: colors.status.pendingTint },
  verified: { ink: colors.status.verified, tint: colors.status.verifiedTint },
  progress: { ink: colors.status.progress, tint: colors.status.progressTint },
  resolved: { ink: colors.status.resolved, tint: colors.status.resolvedTint },
  rejected: { ink: colors.status.rejected, tint: colors.status.rejectedTint },
  neutral: { ink: colors.chipText, tint: colors.chipBackground },
} as const satisfies Record<string, Tone>;

/**
 * Status name → tone, mirroring `CHIP_CLASS` in ecotrack-web's
 * `components/ui.tsx` so the same status is the same colour on both clients.
 * Covers incident verification, task, assignment and event statuses; anything
 * unmapped falls back to neutral rather than inventing a colour.
 */
const STATUS_TONE: Record<string, Tone> = {
  pending: tones.pending,
  approved: tones.verified,
  verified: tones.verified,
  rejected: tones.rejected,
  duplicate: tones.neutral,
  in_progress: tones.progress,
  ongoing: tones.progress,
  scheduled: tones.pending,
  completed: tones.resolved,
  resolved: tones.resolved,
  active: tones.resolved,
  inactive: tones.neutral,
  assigned: tones.pending,
  accepted: tones.verified,
  declined: tones.rejected,
  cancelled: tones.rejected,
};

export function statusTone(status: string | undefined): Tone {
  if (!status) return tones.neutral;
  return STATUS_TONE[status] ?? tones.neutral;
}

/**
 * Urgency-high's ink (#B45900) is the web's token, but on its own tint it is
 * 4.12:1 — under AA for 12-13px labels, which is what these are on a phone.
 * Only its text is darkened (5.16:1); the dot, border and icon keep the web hue,
 * so the ramp still reads as the same orange.
 */
const URGENCY_TEXT: Partial<Record<IncidentSeverity, string>> = {
  high: "#9E4C00",
};

/** The green→red urgency ramp, deliberately separate from `statusTone` — the
 * web keeps `UrgencyBadge` distinct from `Chip` for the same reason. */
export function urgencyTone(severity: IncidentSeverity): Tone {
  return {
    ink: colors.urgency[severity],
    tint: colors.urgencyTint[severity],
    text: URGENCY_TEXT[severity],
  };
}
