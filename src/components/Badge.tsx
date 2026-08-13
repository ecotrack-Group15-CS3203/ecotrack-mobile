import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/colors";

type Props = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
};

export function Badge({ label, backgroundColor = colors.primaryLight, textColor = colors.primary }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
