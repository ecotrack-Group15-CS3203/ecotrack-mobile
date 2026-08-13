import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Chip } from "../../../components/Chip";
import { colors, radii, spacing } from "../../../theme/colors";

export type Urgency = "Low" | "Medium" | "High" | "Critical";

const URGENCY_OPTIONS: { label: Urgency; color: string }[] = [
  { label: "Low", color: colors.urgency.low },
  { label: "Medium", color: colors.urgency.medium },
  { label: "High", color: colors.urgency.high },
  { label: "Critical", color: colors.urgency.critical },
];

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  urgency: Urgency;
  onUrgencyChange: (value: Urgency) => void;
  onSubmit: () => void;
};

export function Step3Details({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  urgency,
  onUrgencyChange,
  onSubmit,
}: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={onTitleChange}
          placeholder="Short description of the hazard"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="What did you observe?"
          placeholderTextColor={colors.textMuted}
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

      <Pressable style={styles.submitButton} onPress={onSubmit} disabled={!title.trim()}>
        <Text style={styles.submitLabel}>Submit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
