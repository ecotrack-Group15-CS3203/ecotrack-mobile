import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing } from "../../theme/colors";
import { compressImage, uploadTaskEvidencePhoto } from "../../services/mediaUpload";
import { toApiError } from "../../services/apiError";
import { useAddTaskPhotos } from "./useTasks";

type RouteParams = { taskId: string; organisationId: string };

export function TaskEvidenceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute();
  const { taskId, organisationId } = params as RouteParams;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhotosMutation = useAddTaskPhotos(organisationId, taskId);

  async function handleCapture(uri: string, width: number, height: number) {
    setIsProcessing(true);
    try {
      const compressed = await compressImage(uri, width, height);
      setPhotoUri(compressed.uri);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await handleCapture(asset.uri, asset.width, asset.height);
  }

  async function handleUpload() {
    if (!photoUri) return;
    setError(null);
    setIsProcessing(true);
    try {
      const mediaUrl = await uploadTaskEvidencePhoto(photoUri);
      await addPhotosMutation.mutateAsync([mediaUrl]);
      navigation.goBack();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Add Evidence Photo</Text>

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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {photoUri ? (
        <View style={styles.row}>
          <Pressable style={styles.retakeButton} onPress={() => setPhotoUri(null)} disabled={isProcessing}>
            <Text style={styles.retakeLabel}>Retake</Text>
          </Pressable>
          <View style={styles.uploadButtonFlex}>
            <PrimaryButton label="Upload" loading={isProcessing} onPress={handleUpload} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable
            style={styles.captureButton}
            disabled={!permission?.granted || isProcessing}
            onPress={async () => {
              if (!cameraRef.current) return;
              setIsProcessing(true);
              try {
                const photo = await cameraRef.current.takePictureAsync();
                await handleCapture(photo.uri, photo.width, photo.height);
              } finally {
                setIsProcessing(false);
              }
            }}
          >
            <Text style={styles.captureLabel}>Capture Photo</Text>
          </Pressable>
          <Pressable style={styles.galleryButton} onPress={handlePickFromGallery} disabled={isProcessing}>
            <Text style={styles.galleryLabel}>Choose from Gallery</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  preview: {
    height: 320,
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
  errorText: {
    fontSize: 13,
    color: colors.danger,
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
  retakeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  retakeLabel: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  uploadButtonFlex: {
    flex: 1,
  },
});
