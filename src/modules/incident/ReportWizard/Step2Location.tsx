import { Pressable, StyleSheet, Text, View } from "react-native";

import { PlaceholderBox } from "../../../components/PlaceholderBox";
import { colors, radii, spacing } from "../../../theme/colors";

type Props = {
  onNext: () => void;
};

export function Step2Location({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <PlaceholderBox tint="#E4EFE6" height={260}>
        <View style={styles.pinOuter}>
          <View style={styles.pinInner} />
        </View>
      </PlaceholderBox>

      <Text style={styles.caption}>GPS accuracy: ±5 m · drag pin to refine location</Text>

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextLabel}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(31,122,76,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
