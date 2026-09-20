import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "../theme/colors";

type Variant = "primary" | "secondary" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Mirrors the web's `.btn-primary` / `.btn-secondary` / `.btn-destructive`. */
  variant?: Variant;
  /** Matches `.btn-sm` — for buttons sitting inside a card or a row. */
  size?: "sm";
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  /** Shown under the button while it is disabled or loading — what it is waiting
   * for. A grey button with no reason reads as broken, not as waiting. */
  hint?: string;
};

const VARIANT_FILL: Record<Variant, string> = {
  primary: colors.primary,
  secondary: "transparent",
  destructive: colors.danger,
};

const VARIANT_INK: Record<Variant, string> = {
  primary: colors.onPrimary,
  secondary: colors.textPrimary,
  destructive: colors.onPrimary,
};

/** The primary-action button style already used inline on LoginScreen,
 * extracted here so every later screen with a single confirming action
 * (accept invite, RSVP, complete task, ...) doesn't redefine it. */
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  size,
  icon,
  style,
  hint,
}: Props) {
  const isDisabled = disabled || loading;
  // Disabled reads as a flat grey fill rather than a dimmed brand colour —
  // the same choice as `.btn-primary:disabled` on the web, where opacity alone
  // still looked tappable.
  const backgroundColor = isDisabled && variant !== "secondary" ? colors.disabled : VARIANT_FILL[variant];
  const ink = isDisabled ? colors.textDisabled : VARIANT_INK[variant];

  const showHint = !!hint && !!isDisabled;

  const button = (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        size === "sm" && styles.buttonSm,
        { backgroundColor },
        variant === "secondary" && styles.secondary,
        pressed && !isDisabled && styles.pressed,
        // With a hint the caller's layout style (flex, alignSelf) belongs to the
        // wrapper that owns the button and its hint together.
        !showHint && style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === "sm" ? 15 : 17} color={ink} /> : null}
          <Text style={[styles.label, size === "sm" && styles.labelSm, { color: ink }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );

  if (!showHint) return button;

  return (
    <View style={[styles.withHint, style]}>
      {button}
      <Text style={styles.hint} accessibilityLiveRegion="polite">
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
  },
  buttonSm: {
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.85,
  },
  withHint: {
    gap: spacing.xs,
  },
  hint: {
    fontSize: 12.5,
    textAlign: "center",
    color: colors.textSecondary,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  labelSm: {
    fontSize: 13,
  },
});
