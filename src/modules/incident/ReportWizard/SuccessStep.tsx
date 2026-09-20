import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PrimaryButton } from "../../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../../theme/colors";

type Props = {
  onDone: () => void;
};

export function SuccessStep({ onDone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>Report Submitted</Text>
      <Text style={styles.subtitle}>
        Thanks — an organization covering this area will typically review reports within 24–48 hours.
      </Text>
      <PrimaryButton label="Done" onPress={onDone} style={styles.doneButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: typography.h2,
  subtitle: {
    ...typography.bodySm,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  doneButton: {
    alignSelf: "stretch",
  },
});
