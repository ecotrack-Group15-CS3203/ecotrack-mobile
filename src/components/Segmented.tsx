import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/colors";
import type { Tone } from "../theme/tones";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Paints this segment with a status/urgency pair when selected, instead of the
   * brand tint. */
  tone?: Tone;
};

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Scrolls horizontally instead of squeezing the segments to equal width — for
   * more than three, or for labels that may grow in another locale (SRS §3.5.8). */
  scrollable?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/**
 * A single-select track: one object with the chosen segment raised, as opposed to
 * `Chip`'s detached multi-select pills. Mirrors the web's `.filter-bar` +
 * `FilterPill`, and is the control SRS §3.1.2 names for urgency.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  scrollable,
  accessibilityLabel,
  style,
}: Props<T>) {
  const segments = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        style={[
          styles.segment,
          scrollable ? styles.segmentScrollable : styles.segmentFlex,
          selected && styles.segmentSelected,
          selected && option.tone && { backgroundColor: option.tone.tint },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            selected && styles.labelSelected,
            selected && { color: option.tone ? (option.tone.text ?? option.tone.ink) : colors.primary },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <View style={[styles.track, style]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {segments}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[styles.track, styles.trackRow, style]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segments}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 3,
  },
  trackRow: {
    flexDirection: "row",
  },
  scrollContent: {
    flexDirection: "row",
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    paddingVertical: 9,
  },
  segmentFlex: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  segmentScrollable: {
    paddingHorizontal: spacing.md,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelSelected: {
    fontWeight: "800",
  },
});
