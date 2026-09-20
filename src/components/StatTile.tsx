import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing, typography } from "../theme/colors";
import type { Tone } from "../theme/tones";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Ink + tint for the icon well and numeral. Omit for the neutral default. */
  tone?: Tone;
  /** A placeholder bar instead of the numeral, while the count is being fetched —
   * never a spinner, which would jump the layout when it resolves. */
  loading?: boolean;
};

/** The web `KpiCard`: a numeral, a label, and an icon well. */
export function StatTile({ label, value, icon, tone, loading }: Props) {
  return (
    <Card style={styles.tile}>
      {icon ? (
        <View style={[styles.iconWell, { backgroundColor: tone?.tint ?? colors.primaryLight }]}>
          <Ionicons name={icon} size={18} color={tone?.ink ?? colors.primary} />
        </View>
      ) : null}
      {loading ? (
        <View style={styles.skeleton} />
      ) : (
        <Text style={[styles.value, tone && { color: tone.text ?? tone.ink }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

/** Equal-width tiles in one row, like the web's `KpiRow`. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    gap: spacing.xs,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h1,
    fontVariant: ["tabular-nums"],
  },
  skeleton: {
    height: 28,
    width: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  label: {
    ...typography.meta,
    fontSize: 12,
  },
});
