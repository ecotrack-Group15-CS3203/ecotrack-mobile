import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "../theme/colors";

/** The web `.error-banner` — a tinted, bordered strip, used wherever a screen
 * previously dropped a bare red sentence into the layout. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
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
    borderColor: colors.danger,
    backgroundColor: colors.dangerTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontSize: 13.5,
    color: colors.danger,
    lineHeight: 19,
  },
});
