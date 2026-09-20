import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "../theme/colors";
import type { Tone } from "../theme/tones";

type Props = {
  message: string;
  /** A second, quieter line — e.g. the reason behind the headline. */
  detail?: string;
  /** Defaults to the danger palette; pass a tone for a notice that isn't an error
   * (a queued-offline banner is a warning at most, and shouldn't read as a fault). */
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** A trailing text button, e.g. "Retry". */
  action?: { label: string; onPress: () => void };
};

const DANGER: Tone = { ink: colors.danger, tint: colors.dangerTint };

/** The web `.error-banner` — a tinted, bordered strip, used wherever a screen
 * previously dropped a bare red sentence into the layout. Also the base for the
 * softer notices (offline, pending) via `tone`. */
export function ErrorBanner({ message, detail, tone = DANGER, icon = "alert-circle-outline", action }: Props) {
  return (
    <View
      style={[styles.banner, { borderColor: tone.ink, backgroundColor: tone.tint }]}
      accessibilityRole={tone === DANGER ? "alert" : undefined}
    >
      <Ionicons name={icon} size={17} color={tone.ink} style={styles.icon} />
      <View style={styles.body}>
        <Text style={[styles.text, { color: tone.ink }]}>{message}</Text>
        {detail ? <Text style={[styles.detail, { color: tone.ink }]}>{detail}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button" style={styles.action}>
          <Text style={[styles.actionLabel, { color: tone.ink }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  detail: {
    fontSize: 12.5,
    lineHeight: 17,
    opacity: 0.85,
  },
  action: {
    alignSelf: "center",
    paddingHorizontal: spacing.xs,
  },
  actionLabel: {
    fontSize: 13.5,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
