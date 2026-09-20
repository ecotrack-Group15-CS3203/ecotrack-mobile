import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "../theme/colors";
import type { Tone } from "../theme/tones";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Makes the chip stand for a severity or status rather than a plain filter. A
   * toned chip shows its colour as a dot even when unselected, so the options read
   * as a scale before one is picked. */
  tone?: Tone;
};

/**
 * A filter pill. Selected reads as a tint with a matching border rather than a
 * solid fill, which is how the web dashboard draws its active filter tabs — a row
 * of solid pills at phone width is far too loud.
 *
 * A toned chip fills with `tone.tint` and writes its label in the tone's text ink,
 * never the brand colour. It used to take a bare `selectedColor` and paint the
 * fill with it while the text stayed brand teal — teal on a dark red/olive/orange
 * fill is 1.0–1.2:1, which is to say the label disappeared.
 */
export function Chip({ label, selected, onPress, tone }: Props) {
  const active = tone?.ink ?? colors.primary;
  const backgroundColor = selected ? (tone?.tint ?? colors.primaryLight) : colors.surface;
  const borderColor = selected ? active : colors.border;
  const textColor = selected ? (tone?.text ?? active) : colors.chipText;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        // Toned chips carry a dot (and, selected, a check) so they need less side
        // padding; four of them then fit one row at phone width instead of wrapping.
        tone && styles.chipToned,
        { backgroundColor, borderColor },
        selected && styles.chipSelected,
        selected && tone && styles.chipTonedSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      {tone ? <View style={[styles.dot, { backgroundColor: tone.ink }]} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected, { color: textColor }]}>{label}</Text>
      {selected && tone ? <Ionicons name="checkmark" size={14} color={textColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipToned: {
    paddingHorizontal: spacing.sm + 4,
    gap: 5,
  },
  chipTonedSelected: {
    paddingHorizontal: spacing.sm + 3,
  },
  // A 2px border on the chosen chip, so selection doesn't rest on colour alone.
  chipSelected: {
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
    paddingVertical: spacing.sm - 1,
  },
  pressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelSelected: {
    fontWeight: "800",
  },
});
