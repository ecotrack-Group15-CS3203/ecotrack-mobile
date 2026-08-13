import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "../../../components/Badge";
import { PlaceholderBox } from "../../../components/PlaceholderBox";
import { colors, radii, spacing } from "../../../theme/colors";

type Props = {
  photoTaken: boolean;
  onCapture: () => void;
  onNext: () => void;
};

export function Step1Photo({ photoTaken, onCapture, onNext }: Props) {
  return (
    <View style={styles.container}>
      <Badge label="Camera permission granted" backgroundColor={colors.primaryLight} textColor={colors.primary} />

      <PlaceholderBox label={photoTaken ? "Photo captured" : "Camera viewfinder"} tint="#EAEAE2" height={260} />

      <View style={styles.row}>
        <Pressable style={styles.captureButton} onPress={onCapture}>
          <Text style={styles.captureLabel}>Capture Photo</Text>
        </Pressable>
        <Pressable style={styles.galleryButton} onPress={onCapture}>
          <Text style={styles.galleryLabel}>Choose from Gallery</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.nextButton, !photoTaken && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={!photoTaken}
      >
        <Text style={styles.nextLabel}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  captureButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  captureLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  galleryLabel: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: colors.chipBackground,
  },
  nextLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
