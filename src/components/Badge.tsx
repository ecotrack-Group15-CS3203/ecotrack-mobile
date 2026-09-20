import { StyleSheet, Text, View } from "react-native";

import { radii } from "../theme/colors";
import { tones, type Tone } from "../theme/tones";

type Props = {
  label: string;
  /** Ink + tint pair — use `statusTone()` / `urgencyTone()` rather than
   * passing raw colours, so a status is the same colour everywhere. */
  tone?: Tone;
  /** The leading dot of the web `.chip`. Off for chips that label a category
   * rather than a state, where a status dot would be misleading. */
  dot?: boolean;
};

/** The web `.chip`: a tinted pill with a same-colour dot, sized down slightly
 * for phone-width rows. */
export function Badge({ label, tone = tones.resolved, dot = true }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: tone.tint }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: tone.ink }]} /> : null}
      <Text style={[styles.label, { color: tone.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
