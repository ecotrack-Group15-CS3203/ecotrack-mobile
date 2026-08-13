import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "../../theme/colors";
import { useAsgardeoAuth } from "./useAsgardeoAuth";

const FEATURES = [
  {
    icon: "location-outline" as const,
    title: "Report what you see",
    subtitle: "Photo, location and urgency in three steps.",
  },
  {
    icon: "checkbox-outline" as const,
    title: "Take on cleanup tasks",
    subtitle: "Volunteer with organizations near you.",
  },
];

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, isReady, isExchanging, error } = useAsgardeoAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="location" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>EcoTrack</Text>
      </View>
      <Text style={styles.tagline}>Report hazards. Coordinate cleanups.</Text>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {isExchanging ? (
          <View style={styles.button}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : (
          <Pressable
            style={[styles.button, !isReady && styles.buttonDisabled]}
            onPress={signIn}
            disabled={!isReady}
          >
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            <Text style={styles.buttonLabel}>{t("auth.login")}</Text>
          </Pressable>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.disclaimer}>
          You&apos;ll be taken to <Text style={styles.bold}>WSO2 Asgardeo</Text> to sign in or create an
          account.
        </Text>
        <Text style={styles.footnote}>Single sign-on · no password stored in EcoTrack</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 72,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.textSecondary,
  },
  features: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  featureSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: "auto",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    marginTop: spacing.sm,
    color: colors.danger,
    textAlign: "center",
  },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  bold: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footnote: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
});
