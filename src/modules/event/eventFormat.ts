/** "9:00 AM – 12:00 PM", in the device's locale and 12/24-hour setting. */
export function formatTimeRange(scheduledAt: string, endsAt: string): string {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(scheduledAt).toLocaleTimeString(undefined, options);
  const end = new Date(endsAt).toLocaleTimeString(undefined, options);
  return `${start} – ${end}`;
}

/** "Wed, Sep 24" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** "Wednesday, September 24" */
export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/** Whether an event can still be RSVPed to — the API rejects a cancelled or
 * completed one (410 / 400). */
export function canRsvp(status: string): boolean {
  return status === "scheduled" || status === "ongoing";
}
