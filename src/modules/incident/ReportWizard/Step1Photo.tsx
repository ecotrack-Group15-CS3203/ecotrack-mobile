import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "../../../components/PrimaryButton";
import { compressImage } from "../../../services/mediaUpload";
import { colors, radii, spacing, typography } from "../../../theme/colors";

type Props = {
  photoUri: string | null;
  onCapture: (uri: string) => void;
  /** Discards the current photo so the camera comes back. */
  onRetake: () => void;
  onNext: () => void;
};

export function Step1Photo({ photoUri, onCapture, onRetake, onNext }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const askedForPermission = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorKey, setErrorKey] = useState<"report.photo.captureFailed" | "report.photo.galleryFailed" | null>(null);

  // Ask on arrival (the point of use, SRS §3.4.9) instead of leaving the user on a
  // disabled Capture button until they work out the preview area is tappable.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !askedForPermission.current) {
      askedForPermission.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const granted = !!permission?.granted;

  const handleCapture = async () => {
    // Guarded on readiness: takePictureAsync before onCameraReady throws, and the
    // camera view is unmounted while a photo is showing, so the ref is null then.
    if (!cameraRef.current || !cameraReady) return;
    setErrorKey(null);
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      const compressed = await compressImage(photo.uri, photo.width, photo.height);
      onCapture(compressed.uri);
    } catch {
      // Was an unhandled rejection: the spinner cleared and nothing else happened.
      setErrorKey("report.photo.captureFailed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    setErrorKey(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (result.canceled) return;

      setIsProcessing(true);
      const asset = result.assets[0];
      const compressed = await compressImage(asset.uri, asset.width, asset.height);
      onCapture(compressed.uri);
    } catch {
      setErrorKey("report.photo.galleryFailed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setErrorKey(null);
    setCameraReady(false);
    onRetake();
  };

  // One line saying what the screen is doing or waiting on, in priority order.
  // Every state where a button is inert has to be explained somewhere on screen.
  const status = isProcessing
    ? t("report.photo.processing")
    : errorKey
      ? t(errorKey)
      : !photoUri && !granted && permission
        ? t("report.photo.needPermission")
        : !photoUri && granted && !cameraReady
          ? t("report.photo.starting")
          : null;
  const statusIsError = !!errorKey && !isProcessing;

  const captureDisabled = photoUri ? isProcessing : !granted || !cameraReady || isProcessing;

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.previewImage}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
        ) : permission === null ? (
          <View style={styles.permissionPrompt}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.permissionPrompt}>
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            {permission.canAskAgain ? (
              <Pressable onPress={requestPermission} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.permissionLabel}>{t("report.photo.allow")}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.permissionLabel}>{t("report.photo.blocked")}</Text>
                <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.settingsLink}>{t("common.openSettings")}</Text>
                </Pressable>
              </>
            )}
            <Text style={styles.permissionHint}>{t("report.photo.hint")}</Text>
          </View>
        )}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={colors.onPrimary} />
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        {/* The first button is Capture until there is a photo, then Retake. The SRS
            requires a Retake control; without one, Capture stayed on screen and did
            nothing once a photo existed, because the camera view had unmounted. */}
        <PrimaryButton
          label={photoUri ? t("report.photo.retake") : t("report.photo.capture")}
          icon={photoUri ? "refresh-outline" : "camera-outline"}
          variant={photoUri ? "secondary" : "primary"}
          style={styles.rowButton}
          onPress={photoUri ? handleRetake : handleCapture}
          disabled={captureDisabled}
        />
        <PrimaryButton
          label={t("report.photo.gallery")}
          variant="secondary"
          icon="images-outline"
          style={styles.rowButton}
          onPress={handlePickFromGallery}
          disabled={isProcessing}
        />
      </View>

      {status ? (
        <View style={styles.statusRow}>
          <Ionicons
            name={statusIsError ? "alert-circle-outline" : "information-circle-outline"}
            size={15}
            color={statusIsError ? colors.danger : colors.textMuted}
          />
          <Text style={[styles.status, statusIsError && styles.statusError]}>{status}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label={t("common.next")}
        onPress={onNext}
        disabled={!photoUri}
        hint={!photoUri ? t("report.photo.addPhoto") : undefined}
      />
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
    textAlign: "center",
  },
  settingsLink: {
    ...typography.bodySm,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
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
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  status: {
    flex: 1,
    ...typography.meta,
    fontSize: 12,
    lineHeight: 17,
  },
  statusError: {
    color: colors.danger,
  },
});
