import type { Ionicons } from "@expo/vector-icons";

import type { IncidentCategory, IncidentSeverity } from "../../types/api";

/**
 * i18n keys, not English strings: module-scope `t()` would capture the language at
 * import time and never update (SRS §3.5.8), so the caller resolves these at
 * render — `t(severityKey(incident.severity))`.
 */
export const severityKey = (severity: IncidentSeverity) => `incident.severity.${severity}` as const;
export const categoryKey = (category: IncidentCategory) => `incident.category.${category}` as const;

/** A glyph per category — the watermark on a photo-less thumbnail. */
export const CATEGORY_ICON: Record<IncidentCategory, keyof typeof Ionicons.glyphMap> = {
  illegal_dumping: "trash-outline",
  water_pollution: "water-outline",
  air_pollution: "cloud-outline",
  deforestation: "leaf-outline",
  wildlife_hazard: "paw-outline",
  other: "alert-circle-outline",
};
