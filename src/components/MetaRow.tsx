import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, typography } from "../theme/colors";
import type { Tone } from "../theme/tones";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  /** Tints the icon and text — an overdue due date, say. */
  tone?: Tone;
  numberOfLines?: number;
  trailing?: React.ReactNode;
};

/** One line of supporting detail: an icon and text. Replaces the hand-rolled
 * icon+label rows that had been copied across the task, event and wizard screens
 * (the web's `MetaList`, adapted to a phone's icon-led idiom). */
export function MetaRow({ icon, text, tone, numberOfLines = 1, trailing }: Props) {
  const ink = tone?.text ?? tone?.ink;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={tone?.ink ?? colors.textMuted} />
      <Text style={[styles.text, ink ? { color: ink } : null]} numberOfLines={numberOfLines}>
        {text}
      </Text>
      {trailing}
    </View>
  );
}

/** Stacks MetaRows with consistent spacing. */
export function MetaList({ children }: { children: React.ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    ...typography.meta,
    color: colors.textSecondary,
  },
  list: {
    gap: 6,
  },
});
