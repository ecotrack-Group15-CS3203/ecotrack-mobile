/**
 * Placeholder fills for rows that have no photo — events (the schema has no image
 * column) and incidents whose `thumbnailUrl` is null. The same five colour pairs
 * ecotrack-web ships in `lib/thumb-gradients.ts`, taken as the two stops of each
 * linear-gradient: `base` fills the tile and `accent` tints the watermark on it.
 *
 * Flat fill + watermark rather than a real gradient because expo-linear-gradient is
 * not installed, and a native module on the startup path (SRS §3.4.3's 3 s budget)
 * is not worth it for decoration.
 */
export const THUMB_FILLS: readonly { base: string; accent: string }[] = [
  { base: "#F0997B", accent: "#D85A30" },
  { base: "#85B7EB", accent: "#378ADD" },
  { base: "#97C459", accent: "#639922" },
  { base: "#9FE1CB", accent: "#5DCAA5" },
  { base: "#F5C4B3", accent: "#D85A30" },
];

/** A small stable string hash (djb2). Not for security — only so the same id maps
 * to the same fill on every render, every launch, and on both clients. */
function hash(seed: string): number {
  let value = 5381;
  for (let i = 0; i < seed.length; i++) {
    value = ((value << 5) + value + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(value);
}

/** Deterministic: the same seed always picks the same fill. */
export function thumbFill(seed: string): { base: string; accent: string } {
  return THUMB_FILLS[hash(seed) % THUMB_FILLS.length];
}
