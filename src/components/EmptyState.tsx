import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing, typography } from "../theme/colors";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** One line explaining what would put something here. */
  message?: string;
  /** Usually a PrimaryButton taking the user to wherever that happens. */
  action?: React.ReactNode;
};

/** The web `.empty-state`, which never leaves a list blank: an icon, a
 * sentence about why it's empty, and the action that would fill it. */
export function EmptyState({ icon = "leaf-outline", title, message, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    textAlign: "center",
  },
  message: {
    ...typography.meta,
    marginTop: spacing.xs,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 19,
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: "stretch",
    maxWidth: 320,
  },
});
