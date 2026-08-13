export const colors = {
  primary: "#1F7A4C",
  primaryDark: "#175C39",
  primaryLight: "#DCEEE1",

  background: "#F5F5F0",
  surface: "#FFFFFF",

  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  border: "#E5E7EB",

  chipBackground: "#EDEDE6",
  chipText: "#4B5563",

  urgency: {
    low: "#2E9E5B",
    medium: "#E8A93B",
    high: "#E8722C",
    critical: "#D64545",
  },

  danger: "#B3261E",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;
