import { StyleSheet, Text, View } from "react-native";

import { colors, radii, shadows } from "../theme/colors";
import { tones, type Tone } from "../theme/tones";

type Props = {
  date: string | Date;
  tone?: Tone;
  size?: "sm" | "md";
};

/** The mockup's calendar tile — month over day numeral. Used on event cards only,
 * where it earns its size; elsewhere a date is just a MetaRow. */
export function DateTile({ date, tone = tones.progress, size = "md" }: Props) {
  const value = typeof date === "string" ? new Date(date) : date;
  const dimension = size === "md" ? 52 : 40;

  return (
    <View
      style={[styles.tile, { width: dimension, height: dimension, backgroundColor: colors.surface }]}
      accessibilityLabel={value.toLocaleDateString(undefined, { day: "numeric", month: "long" })}
    >
      <Text style={[styles.month, { color: tone.text ?? tone.ink }]}>
        {value.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
      </Text>
      <Text style={[styles.day, size === "sm" && styles.daySm]}>{value.getDate()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  month: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  day: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 22,
  },
  daySm: {
    fontSize: 16,
    lineHeight: 18,
  },
});
