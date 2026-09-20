import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import { PrimaryButton } from "../../../components/PrimaryButton";
import { compressImage } from "../../../services/mediaUpload";
import { colors, radii, spacing, typography } from "../../../theme/colors";

type Props = {
  photoUri: string | null;
  onCapture: (uri: string) => void;
  onNext: () => void;
};

export function Step1Photo({ photoUri, onCapture, onNext }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      const compressed = await compressImage(photo.uri, photo.width, photo.height);
      onCapture(compressed.uri);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (result.canceled) return;

    setIsProcessing(true);
    try {
      const asset = result.assets[0];
      const compressed = await compressImage(asset.uri, asset.width, asset.height);
      onCapture(compressed.uri);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.previewImage} facing="back" />
        ) : (
          <Pressable style={styles.permissionPrompt} onPress={requestPermission} accessibilityRole="button">
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.permissionLabel}>Tap to allow camera access</Text>
            <Text style={styles.permissionHint}>A photo is what lets a responder recognise the site.</Text>
          </Pressable>
        )}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={colors.onPrimary} />
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        <PrimaryButton
          label="Capture"
          icon="camera-outline"
          style={styles.rowButton}
          onPress={handleCapture}
          disabled={!permission?.granted || isProcessing}
        />
        <PrimaryButton
          label="Gallery"
          variant="secondary"
          icon="images-outline"
          style={styles.rowButton}
          onPress={handlePickFromGallery}
          disabled={isProcessing}
        />
      </View>

      <PrimaryButton label="Next" onPress={onNext} disabled={!photoUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  preview: {
    height: 280,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  previewImage: {
    flex: 1,
  },
  permissionPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  permissionLabel: {
    ...typography.bodySm,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  permissionHint: {
    ...typography.meta,
    fontSize: 12,
    textAlign: "center",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});
