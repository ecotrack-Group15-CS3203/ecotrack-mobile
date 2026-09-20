import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";

import { Ionicons } from "@expo/vector-icons";

import { PrimaryButton } from "../../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../../theme/colors";

export type Coordinate = { latitude: number; longitude: number };

type Props = {
  coordinate: Coordinate | null;
  onCoordinateChange: (coordinate: Coordinate) => void;
  onNext: () => void;
};

export function Step2Location({ coordinate, onCoordinateChange, onNext }: Props) {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [isLocating, setIsLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coordinate || !permission?.granted) return;

    setIsLocating(true);
    setError(null);

    Location.getCurrentPositionAsync()
      .then((position) => {
        onCoordinateChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setAccuracy(position.coords.accuracy);
      })
      .catch(() => setError("Couldn't get your current location - drag the pin to set it manually."))
      .finally(() => setIsLocating(false));
  }, [permission?.granted, coordinate]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {!permission?.granted ? (
          <Pressable style={styles.permissionPrompt} onPress={requestPermission} accessibilityRole="button">
            <Ionicons name="location-outline" size={28} color={colors.textMuted} />
            <Text style={styles.permissionLabel}>Tap to allow location access</Text>
          </Pressable>
        ) : isLocating || !coordinate ? (
          <View style={styles.permissionPrompt}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <MapView style={styles.map} scaleBarEnabled={false}>
            <Camera
              defaultSettings={{
                centerCoordinate: [coordinate.longitude, coordinate.latitude],
                zoomLevel: 15,
              }}
            />
            <PointAnnotation
              id="incident-location"
              coordinate={[coordinate.longitude, coordinate.latitude]}
              draggable
              onDragEnd={(payload) => {
                const [longitude, latitude] = payload.geometry.coordinates;
                onCoordinateChange({ latitude, longitude });
              }}
            >
              <View style={styles.pinOuter}>
                <View style={styles.pinInner} />
              </View>
            </PointAnnotation>
          </MapView>
        )}
      </View>

      <View style={styles.captionRow}>
        <Ionicons
          name={error ? "alert-circle-outline" : "information-circle-outline"}
          size={15}
          color={error ? colors.danger : colors.textMuted}
        />
        <Text style={[styles.caption, !!error && styles.captionError]}>
          {error ??
            (accuracy
              ? `GPS accuracy: ±${Math.round(accuracy)} m · drag pin to refine location`
              : "Drag the pin to refine your location")}
        </Text>
      </View>

      <PrimaryButton label="Next" onPress={onNext} disabled={!coordinate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mapWrapper: {
    height: 280,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  permissionPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  permissionLabel: {
    ...typography.bodySm,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // The brand teal at low alpha — the halo around the draggable pin.
    backgroundColor: "rgba(15,118,110,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  caption: {
    flex: 1,
    ...typography.meta,
    fontSize: 12,
    lineHeight: 17,
  },
  captionError: {
    color: colors.danger,
  },
});
