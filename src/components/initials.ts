/**
 * Up to two initials from a display name, uppercased — the same algorithm as
 * ecotrack-web's `Avatar` (`components/ui.tsx`), so one person is the same two
 * letters on both clients.
 */
export function initialsOf(name: string | null | undefined): string {
  const initials = (name ?? "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}
