import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { BrandLockup } from "../../components/brand/BrandLockup";
import { colors, radii, spacing, typography } from "../../theme/colors";
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
  {
    icon: "notifications-outline" as const,
    title: "Know what's nearby",
    subtitle: "Alerts for hazards reported around you.",
  },
];

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, isReady, isExchanging, error } = useAsgardeoAuth();

  return (
    <View style={styles.container}>
      <BrandLockup markSize={96} tone="light" />
      <Text style={styles.intro}>Report hazards. Coordinate cleanups.</Text>

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
        <PrimaryButton
          label={t("auth.login")}
          icon="lock-closed"
          loading={isExchanging}
          disabled={!isReady}
          onPress={signIn}
        />
        {error ? (
          <View style={styles.errorWrap}>
            <ErrorBanner message={error} />
          </View>
        ) : null}
        <Text style={styles.disclaimer}>
          You&apos;ll be taken to <Text style={styles.bold}>WSO2 Asgardeo</Text> to sign in or create an
          account.
        </Text>
        <Text style={styles.footnote}>Single sign-on · no password stored in {t("brand.name")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
    paddingBottom: spacing.xl,
  },
  intro: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  features: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h3,
    fontSize: 15,
  },
  featureSubtitle: {
    marginTop: 2,
    ...typography.meta,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: "auto",
  },
  errorWrap: {
    marginTop: spacing.md,
  },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footnote: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
});
