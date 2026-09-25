import type { TextStyle, ViewStyle } from "react-native";

/**
 * Design tokens shared with ecotrack-web's `.eco` scope
 * (`app/(org)/dashboard.css`) so the phone and the admin console read as one
 * product rather than two apps that happen to share a name. The brand values
 * come from the EcoTrack brand sheet (`Logo and styles/Design.png`): secondary
 * green #2E7D32 carries fills and ink, primary green #4CAF50 is an accent only
 * (white text on it fails contrast), dark green #0E3B2E is the splash/brand
 * surface and earth brown #3E2F22 is the wordmark ink. When a token changes on
 * the web, change it here too. Dark mode is deliberately not ported: the web
 * has a theme toggle, this app has no surface for one yet.
 *
 * Key names kept from the original mobile palette (textPrimary/textMuted/…)
 * rather than renamed to the CSS custom-property spelling, so this is a
 * re-theme and not a rename touching every screen.
 */
export const colors = {
  /** `--primary`: brand secondary green. A fill dark enough to carry white
   * text (5.1:1), and the same value doubles as ink on white. */
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#E8F5E9",
  onPrimary: "#FFFFFF",

  /** Brand-only colours: the splash/boot surface, the bright accent green and
   * the wordmark's earth brown. */
  brandDark: "#0E3B2E",
  brandAccent: "#4CAF50",
  earth: "#3E2F22",

  background: "#F4F8F4",
  surface: "#FFFFFF",
  /** `--surface-2` / `--surface-3`: quiet fills for inset rows and wells. */
  surfaceMuted: "#EFF5F3",
  surfaceRaised: "#F6FAF9",

  textPrimary: "#333333",
  textSecondary: "#53625E",
  textMuted: "#6A7975",
  textDisabled: "#A8B5B2",

  border: "#DCE8E5",
  borderStrong: "#C0D2CE",

  chipBackground: "#EFF5F3",
  chipText: "#53625E",

  /** Workflow status tones — ink + the tint it sits on, same pairs the web
   * `.chip-*` classes use. */
  status: {
    pending: "#8A5A00",
    pendingTint: "#FBF0DB",
    verified: "#175FA6",
    verifiedTint: "#E4F0FB",
    progress: "#4F46B5",
    progressTint: "#EBEAFC",
    resolved: "#2E7D32",
    resolvedTint: "#E8F5E9",
    rejected: "#A32D2D",
    rejectedTint: "#FBE9E9",
  },

  /** Severity/urgency ramp. Green → yellow → orange → red, distinct from the
   * status tones above so "high urgency" never reads as "rejected". */
  urgency: {
    low: "#1E7A34",
    medium: "#6B5F00",
    high: "#B45900",
    critical: "#B4231F",
  },
  urgencyTint: {
    low: "#E1F5E7",
    medium: "#F9F5D6",
    high: "#FCEBD7",
    critical: "#FADFDE",
  },

  danger: "#A32D2D",
  dangerDark: "#791F1F",
  dangerTint: "#FBE9E9",

  disabled: "#D3DEDB",
  /** Shadows are tinted with the surface's own green-grey rather than pure
   * black, which on the mint background reads as dirt. */
  shadow: "#102824",
  scrim: "rgba(12,32,28,0.42)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** `--radius-sm/md/lg` from the `.eco` scope. `pill` has no web equivalent —
 * it's the fully-rounded chip/avatar shape. */
export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

/** Montserrat faces loaded in App.tsx. Brand lockups only (wordmark and
 * tagline) — body text stays on the system font. */
export const fonts = {
  brand: "Montserrat_600SemiBold",
  brandMedium: "Montserrat_500Medium",
} as const;

/**
 * The web type scale (`--fs-h1` … `--fs-meta`), plus the uppercase section
 * label the dashboard styles inline. Spread these into StyleSheet entries
 * rather than restating sizes per screen.
 */
export const typography = {
  h1: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2, color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  bodySm: { fontSize: 14, color: colors.textSecondary },
  meta: { fontSize: 13, color: colors.textMuted },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  /** The "ECOTRACK" wordmark. Colour is set by the lockup's tone. */
  wordmark: {
    fontFamily: fonts.brand,
    fontSize: 22,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  /** "Report. Act. Keep It Clean." under the wordmark. */
  tagline: {
    fontFamily: fonts.brandMedium,
    fontSize: 12,
    letterSpacing: 1.2,
  },
} satisfies Record<string, TextStyle>;

/** `--shadow-card` / `--shadow-pop`, translated to RN's single-shadow model:
 * iOS takes the offset/radius pair, Android only `elevation`. */
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pop: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;
