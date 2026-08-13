import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing } from "../theme/colors";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  selectedColor?: string;
};

export function Chip({ label, selected, onPress, selectedColor }: Props) {
  const backgroundColor = selected ? (selectedColor ?? colors.primary) : colors.chipBackground;
  const textColor = selected ? "#FFFFFF" : colors.chipText;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor }]}
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
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
