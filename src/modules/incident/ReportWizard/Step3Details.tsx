import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Chip } from "../../../components/Chip";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { colors, radii, spacing } from "../../../theme/colors";
import { urgencyTone } from "../../../theme/tones";
import type { IncidentSeverity } from "../../../types/api";

export type Urgency = "Low" | "Medium" | "High" | "Critical";

/** Each option's tone comes from the shared urgency ramp, so "Critical" here is
 * the same red as a critical badge on the map and in the web console. */
const URGENCY_OPTIONS: { value: Urgency; severity: IncidentSeverity }[] = [
  { value: "Low", severity: "low" },
  { value: "Medium", severity: "medium" },
  { value: "High", severity: "high" },
  { value: "Critical", severity: "critical" },
];

const MIN_TITLE_LENGTH = 5;
// The API rejects anything longer with a 400 (CreateIncidentDto) — enforced here
// so an over-long report can't be queued and then fail on every retry.
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  urgency: Urgency;
  onUrgencyChange: (value: Urgency) => void;
  onSubmit: () => void;
};

function titleErrorKey(title: string): "report.validation.titleRequired" | "report.validation.titleTooShort" | null {
  const trimmed = title.trim();
  if (!trimmed) return "report.validation.titleRequired";
  if (trimmed.length < MIN_TITLE_LENGTH) return "report.validation.titleTooShort";
  return null;
}

export function Step3Details({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  urgency,
  onUrgencyChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [titleTouched, setTitleTouched] = useState(false);

  const errorKey = titleErrorKey(title);
  const error = errorKey ? t(errorKey) : null;
  const showError = titleTouched && !!error;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{t("report.fields.title")}</Text>
        <TextInput
          style={[styles.input, showError && styles.inputError]}
          value={title}
          onChangeText={onTitleChange}
          onBlur={() => setTitleTouched(true)}
          placeholder={t("report.fields.titlePlaceholder")}
          placeholderTextColor={colors.textDisabled}
          maxLength={MAX_TITLE_LENGTH}
        />
        {showError ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View>
        <Text style={styles.label}>{t("report.fields.description")}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t("report.fields.descriptionPlaceholder")}
          placeholderTextColor={colors.textDisabled}
          maxLength={MAX_DESCRIPTION_LENGTH}
          multiline
        />
      </View>

      <View>
        <Text style={styles.label}>{t("report.fields.urgency")}</Text>
        <View style={styles.chipRow}>
          {URGENCY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={t(`report.urgency.${option.severity}`)}
              selected={option.value === urgency}
              tone={urgencyTone(option.severity)}
              onPress={() => onUrgencyChange(option.value)}
            />
          ))}
        </View>
      </View>

      {/* Never disabled: a grey button that ignores taps and says nothing is what
          made this step feel broken. Pressing it with a bad title reveals the
          inline error instead, which is the feedback the user was missing. */}
      <PrimaryButton
        label={t("report.submit")}
        icon="send-outline"
        onPress={() => {
          setTitleTouched(true);
          if (!error) onSubmit();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: colors.danger,
  },
  textarea: {
    height: 96,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
