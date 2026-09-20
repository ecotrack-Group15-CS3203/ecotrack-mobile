import { StyleSheet, View, ViewProps } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/colors";

/** The web `.card`: solid white, a hairline border, and a shadow soft enough
 * that the border does the separating. */
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
});
