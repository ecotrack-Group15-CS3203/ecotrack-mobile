import type { IncidentCategory, IncidentSeverity } from "../../types/api";

export const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  illegal_dumping: "Illegal dumping",
  water_pollution: "Water pollution",
  air_pollution: "Air pollution",
  deforestation: "Deforestation",
  wildlife_hazard: "Wildlife hazard",
  other: "Other",
};

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};
