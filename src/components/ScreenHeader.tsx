import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { spacing, typography } from "../theme/colors";

type Props = {
  title: string;
  subtitle?: string;
  /** Rendered to the right of the title — a count, a status chip, an action. */
  trailing?: React.ReactNode;
  style?: ViewStyle;
};

/** The web `.page-header`: title, one line of context under it, and an
 * optional trailing slot. Every top-level screen opens with this so headings
 * line up across tabs instead of each screen sizing its own. */
export function ScreenHeader({ title, subtitle, trailing, style }: Props) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  text: {
    flex: 1,
  },
  title: typography.h1,
  subtitle: {
    ...typography.bodySm,
    marginTop: spacing.xs,
  },
});
