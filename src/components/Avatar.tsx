import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "../theme/colors";
import { initialsOf } from "./initials";

type AvatarProps = { name: string | null | undefined; size?: number };

/** The web `.avatar`: initials on the brand tint. */
export function Avatar({ name, size = 40 }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

type StackProps = { names: (string | null | undefined)[]; max?: number; size?: number };

/** Overlapping avatars with a "+N" bubble past `max` — the mockup's attendee row.
 * Each avatar is ringed in the card colour so the overlap reads as layers. */
export function AvatarStack({ names, max = 4, size = 30 }: StackProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;

  return (
    <View style={styles.stack}>
      {shown.map((name, index) => (
        <View key={index} style={[styles.ring, index > 0 && { marginLeft: -size / 3 }]}>
          <Avatar name={name} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.ring, { marginLeft: -size / 3 }]}>
          <View style={[styles.more, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.moreLabel, { fontSize: size * 0.36 }]}>+{extra}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.primary,
    fontWeight: "700",
  },
  stack: {
    flexDirection: "row",
    alignItems: "center",
  },
  ring: {
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  more: {
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  moreLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
});
