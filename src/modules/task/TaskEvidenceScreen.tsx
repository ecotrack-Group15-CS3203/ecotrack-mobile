import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../theme/colors";
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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Evidence Photo</Text>
      </View>

      <View style={styles.preview}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.previewImage} facing="back" />
        ) : (
          <Pressable style={styles.permissionPrompt} onPress={requestPermission} accessibilityRole="button">
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.permissionLabel}>Tap to allow camera access</Text>
          </Pressable>
        )}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={colors.onPrimary} />
          </View>
        ) : null}
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {photoUri ? (
        <View style={styles.row}>
          <PrimaryButton
            label="Retake"
            variant="secondary"
            icon="refresh-outline"
            disabled={isProcessing}
            onPress={() => setPhotoUri(null)}
          />
          <View style={styles.uploadButtonFlex}>
            <PrimaryButton
              label="Upload"
              icon="cloud-upload-outline"
              loading={isProcessing}
              onPress={handleUpload}
            />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <PrimaryButton
            label="Capture"
            icon="camera-outline"
            style={styles.rowButton}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: typography.h2,
  preview: {
    height: 320,
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
    gap: spacing.sm,
  },
  permissionLabel: {
    ...typography.bodySm,
    fontWeight: "600",
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
  uploadButtonFlex: {
    flex: 1,
  },
});
