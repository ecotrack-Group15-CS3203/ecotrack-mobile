import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import Mapbox, { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";

import { env } from "../../../config/env";
import { colors, radii, spacing } from "../../../theme/colors";

Mapbox.setAccessToken(env.MAPBOX_TOKEN);

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
          <Pressable style={styles.permissionPrompt} onPress={requestPermission}>
            <Text style={styles.permissionLabel}>Tap to allow location access</Text>
          </Pressable>
        ) : isLocating || !coordinate ? (
          <View style={styles.permissionPrompt}>
            <ActivityIndicator />
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

      <Text style={styles.caption}>
        {error ?? (accuracy ? `GPS accuracy: ±${Math.round(accuracy)} m · drag pin to refine location` : "Drag the pin to refine your location")}
      </Text>

      <Pressable style={[styles.nextButton, !coordinate && styles.nextButtonDisabled]} onPress={onNext} disabled={!coordinate}>
        <Text style={styles.nextLabel}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mapWrapper: {
    height: 260,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: "#E4EFE6",
  },
  map: {
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
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(31,122,76,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
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
