import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "../theme/colors";

type Props = {
  label?: string;
  tint?: string;
  height?: number;
  children?: ReactNode;
};

export function PlaceholderBox({ label, tint = "#E5E5DC", height = 260, children }: Props) {
  return (
    <View style={[styles.box, { backgroundColor: tint, height }]}>
      {children ?? <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
});
