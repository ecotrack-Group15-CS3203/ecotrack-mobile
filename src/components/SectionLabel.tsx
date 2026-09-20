import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { spacing, typography } from "../theme/colors";

type Props = {
  label: string;
  /** A spinner or count sitting opposite the label. */
  trailing?: React.ReactNode;
  style?: ViewStyle;
};

/** The small uppercase heading the dashboard uses above a group of controls. */
export function SectionLabel({ label, trailing, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: typography.label,
});
