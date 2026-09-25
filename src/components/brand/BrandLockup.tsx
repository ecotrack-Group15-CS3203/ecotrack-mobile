import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { colors, spacing, typography } from "../../theme/colors";
import { BrandLogo, BrandTone } from "./BrandLogo";

type Props = {
  /** Mark box size in dp. The wordmark scales with it. */
  markSize?: number;
  layout?: "stacked" | "inline";
  tone?: BrandTone;
  showTagline?: boolean;
  style?: ViewStyle;
};

/** Mark + "ECOTRACK" wordmark (+ optional tagline), coloured per the brand
 * sheet: earth-brown wordmark on light surfaces, white on dark green. */
export function BrandLockup({
  markSize = 64,
  layout = "stacked",
  tone = "light",
  showTagline = true,
  style,
}: Props) {
  const { t } = useTranslation();
  const stacked = layout === "stacked";
  const wordmarkSize = stacked ? Math.max(20, Math.round(markSize * 0.36)) : Math.round(markSize * 0.5);

  return (
    <View
      style={[stacked ? styles.stacked : styles.inline, style]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={showTagline ? `${t("brand.name")}. ${t("brand.tagline")}` : t("brand.name")}
    >
      <BrandLogo size={markSize} tone={tone} />
      <View style={stacked ? styles.textStacked : undefined}>
        <Text
          style={[
            typography.wordmark,
            { fontSize: wordmarkSize, color: tone === "dark" ? colors.onPrimary : colors.earth },
          ]}
        >
          {t("brand.name")}
        </Text>
        {showTagline ? (
          <Text
            style={[
              typography.tagline,
              stacked && styles.taglineStacked,
              { color: tone === "dark" ? colors.brandAccent : colors.primary },
            ]}
          >
            {t("brand.tagline")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stacked: { alignItems: "center" },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  textStacked: { alignItems: "center", marginTop: spacing.md },
  taglineStacked: { marginTop: spacing.xs },
});
