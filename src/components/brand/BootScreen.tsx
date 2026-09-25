import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { colors, spacing, typography } from "../../theme/colors";
import { BrandLogo } from "./BrandLogo";

/** Must match `imageWidth` of the expo-splash-screen plugin in app.config.ts,
 * so the native splash hands off to this screen without the mark moving. */
export const SPLASH_MARK_SIZE = 160;

/** Shown while auth hydrates, straight after the native splash. The mark sits
 * at the exact centre (where the native splash drew it); the wordmark,
 * tagline and spinner hang below it rather than pushing it up. */
export function BootScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container} accessibilityLabel={t("brand.loading")}>
      <StatusBar style="light" />
      <BrandLogo size={SPLASH_MARK_SIZE} tone="dark" />
      <View style={styles.below}>
        <Text style={[typography.wordmark, styles.wordmark]}>{t("brand.name")}</Text>
        <Text style={[typography.tagline, styles.tagline]}>{t("brand.tagline")}</Text>
        <ActivityIndicator color={colors.onPrimary} style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
  },
  below: {
    position: "absolute",
    top: "50%",
    marginTop: SPLASH_MARK_SIZE / 2 + spacing.md,
    alignItems: "center",
  },
  wordmark: { fontSize: 30, color: colors.onPrimary },
  tagline: { marginTop: spacing.xs, color: colors.brandAccent },
  spinner: { marginTop: spacing.xl },
});
