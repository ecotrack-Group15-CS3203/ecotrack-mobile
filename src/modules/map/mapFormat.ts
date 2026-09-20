/** Which greeting the time of day calls for. Takes the hour so it is testable
 * without faking the clock. */
export function greetingPeriod(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** "maya singh" -> "Maya". Names come from the identity provider in whatever case
 * the user typed them, so the greeting normalises rather than echoing "maya". */
export function firstName(fullName: string | null | undefined): string | null {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** "350 m" under a kilometre, "1.2 km" above; whole metres, one decimal of km. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Milliseconds since the epoch, tolerating the Postgres text format.
 *
 * `/incidents/nearby` is a raw SQL query, and the API's Drizzle driver returns raw
 * timestamptz columns as strings in Postgres's own shape — `2026-09-20
 * 20:28:07.293696+00`: a space instead of `T`, a bare `+00` offset and microsecond
 * precision. V8 tolerates that; Hermes (React Native) does not, so `new Date(...)`
 * was Invalid Date and the panel printed "NaNd ago". Normalised to ISO 8601 first.
 */
export function parseTimestamp(value: string): number {
  const iso = value
    .trim()
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00")
    .replace(/(\.\d{3})\d+/, "$1");
  return Date.parse(iso);
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** "Just now" / "5m ago" / "2h ago" / "3d ago", or null for a timestamp that
 * can't be read — better to show nothing than "NaNd ago". */
export function timeAgo(isoDate: string, t: Translate, now: number = Date.now()): string | null {
  const then = parseTimestamp(isoDate);
  if (Number.isNaN(then)) return null;
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return t("common.timeAgo.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("common.timeAgo.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("common.timeAgo.hours", { count: hours });
  return t("common.timeAgo.days", { count: Math.floor(hours / 24) });
}
