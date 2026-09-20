import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Chip } from "../../../components/Chip";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { colors, radii, spacing } from "../../../theme/colors";

export type Urgency = "Low" | "Medium" | "High" | "Critical";

/** The chip fills come from the shared urgency ramp, so "Critical" here is the
 * same red as a critical badge on the map and in the web console. */
const URGENCY_OPTIONS: { label: Urgency; color: string }[] = [
  { label: "Low", color: colors.urgency.low },
  { label: "Medium", color: colors.urgency.medium },
  { label: "High", color: colors.urgency.high },
  { label: "Critical", color: colors.urgency.critical },
];

const MIN_TITLE_LENGTH = 5;

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  urgency: Urgency;
  onUrgencyChange: (value: Urgency) => void;
  onSubmit: () => void;
};

function titleError(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "Add a short title so responders know what to expect.";
  if (trimmed.length < MIN_TITLE_LENGTH) return "Title is a little too short - add a few more details.";
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
  const [titleTouched, setTitleTouched] = useState(false);

  const error = titleError(title);
  const showError = titleTouched && !!error;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[styles.input, showError && styles.inputError]}
          value={title}
          onChangeText={onTitleChange}
          onBlur={() => setTitleTouched(true)}
          placeholder="Short description of the hazard"
          placeholderTextColor={colors.textDisabled}
        />
        {showError ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="What did you observe?"
          placeholderTextColor={colors.textDisabled}
          multiline
        />
      </View>

      <View>
        <Text style={styles.label}>Urgency</Text>
        <View style={styles.chipRow}>
          {URGENCY_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={option.label === urgency}
              selectedColor={option.color}
              onPress={() => onUrgencyChange(option.label)}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        label="Submit Report"
        icon="send-outline"
        disabled={!!error}
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
