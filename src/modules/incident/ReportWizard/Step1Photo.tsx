import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { Badge } from "../../../components/Badge";
import { compressImage } from "../../../services/mediaUpload";
import { colors, radii, spacing } from "../../../theme/colors";

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
      {permission?.granted ? (
        <Badge label="Camera permission granted" backgroundColor={colors.primaryLight} textColor={colors.primary} />
      ) : null}

      <View style={styles.preview}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.previewImage} facing="back" />
        ) : (
          <Pressable style={styles.permissionPrompt} onPress={requestPermission}>
            <Text style={styles.permissionLabel}>Tap to allow camera access</Text>
          </Pressable>
        )}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={!permission?.granted || isProcessing}
        >
          <Text style={styles.captureLabel}>Capture Photo</Text>
        </Pressable>
        <Pressable style={styles.galleryButton} onPress={handlePickFromGallery} disabled={isProcessing}>
          <Text style={styles.galleryLabel}>Choose from Gallery</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.nextButton, !photoUri && styles.nextButtonDisabled]} onPress={onNext} disabled={!photoUri}>
        <Text style={styles.nextLabel}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  preview: {
    height: 260,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: "#EAEAE2",
  },
  previewImage: {
    flex: 1,
  },
  permissionPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
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
