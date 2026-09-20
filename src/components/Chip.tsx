import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing } from "../theme/colors";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Overrides the selected fill — used where a chip stands for a severity or
   * status rather than a filter. */
  selectedColor?: string;
};

/**
 * A filter pill. Selected reads as the brand tint with a matching border
 * rather than a solid fill, which is how the web dashboard draws its active
 * filter tabs — a row of solid green pills at phone width is far too loud.
 */
export function Chip({ label, selected, onPress, selectedColor }: Props) {
  const backgroundColor = selected ? (selectedColor ?? colors.primaryLight) : colors.surface;
  const borderColor = selected ? (selectedColor ?? colors.primary) : colors.border;
  const textColor = selected ? colors.primary : colors.chipText;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
