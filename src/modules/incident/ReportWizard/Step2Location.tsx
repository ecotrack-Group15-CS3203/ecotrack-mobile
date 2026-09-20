import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "../../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../../theme/colors";
import { DEFAULT_MAP_CENTER, getBalancedFix, getLastKnownFix, LOCATION_RATIONALE } from "../../map/locationService";

export type Coordinate = { latitude: number; longitude: number };

type Props = {
  coordinate: Coordinate | null;
  onCoordinateChange: (coordinate: Coordinate) => void;
  onNext: () => void;
};

/** How long to wait for a fix before offering the map anyway, so the user can
 * place the pin by hand instead of watching a spinner. */
const SLOW_FIX_MS = 6_000;

export function Step2Location({ coordinate, onCoordinateChange, onNext }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const [fixFailed, setFixFailed] = useState(false);
  // Where the camera looks. Follows GPS fixes, but deliberately not the user's own
  // pin moves — recentring the map under a finger that is mid-drag fights them.
  const [cameraCenter, setCameraCenter] = useState<Coordinate | null>(coordinate);
  // Once the user has placed the pin themselves, a late GPS fix must not yank it.
  const userPlaced = useRef(false);
  const askedForPermission = useRef(false);

  // Step 2 is the point of use for location (SRS §3.4.9), so ask on arrival rather
  // than leaving a placeholder that only works if the user thinks to tap it.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !askedForPermission.current) {
      askedForPermission.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!permission?.granted || coordinate) return;

    let active = true;
    setSlow(false);
    setFixFailed(false);
    const slowTimer = setTimeout(() => active && setSlow(true), SLOW_FIX_MS);

    const apply = (fix: { coordinate: Coordinate; accuracyMeters: number | null }) => {
      if (!active || userPlaced.current) return;
      onCoordinateChange(fix.coordinate);
      setCameraCenter(fix.coordinate);
      setAccuracy(fix.accuracyMeters);
    };

    // Two fixes in parallel: the cached one lands at once and un-disables Next, the
    // live one then refines it. Previously Next waited on a cold high-accuracy GPS
    // request alone — routinely 5-30 s indoors, with nothing on screen to say why.
    void getLastKnownFix().then((fix) => fix && apply(fix));
    void getBalancedFix().then((fix) => {
      if (!active) return;
      if (fix) apply(fix);
      else setFixFailed(true);
    });

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [permission?.granted]);

  function place(next: Coordinate) {
    userPlaced.current = true;
    onCoordinateChange(next);
  }

  const granted = !!permission?.granted;
  // With no fix yet, show the map anyway once it has been slow: an empty spinner is
  // a dead end, a map at the fallback centre lets the user put the pin where they are.
  const showMap = granted && (!!coordinate || slow || fixFailed);
  const pin = coordinate ?? DEFAULT_MAP_CENTER;

  const caption = fixFailed
    ? t("report.location.failed")
    : !coordinate && slow
      ? t("report.location.slow")
      : accuracy
        ? t("report.location.accuracy", { meters: Math.round(accuracy) })
        : t("report.location.dragHint");
  const captionIsWarning = fixFailed || (!coordinate && slow);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {permission === null ? (
          <View style={styles.placeholder}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !granted ? (
          <View style={styles.placeholder}>
            <Ionicons name="location-outline" size={28} color={colors.textMuted} />
            {permission.canAskAgain ? (
              <Pressable onPress={requestPermission} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.permissionLabel}>{t("report.location.allow")}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.permissionLabel}>{t("report.location.blocked")}</Text>
                <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.settingsLink}>{t("common.openSettings")}</Text>
                </Pressable>
              </>
            )}
            <Text style={styles.rationale}>{LOCATION_RATIONALE.incidentReport}</Text>
          </View>
        ) : !showMap ? (
          <View style={styles.placeholder}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.permissionLabel}>{t("report.location.locating")}</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            scaleBarEnabled={false}
            // Required attribution on every map view (SRS §3.11.4) — this one was
            // missing it.
            attributionEnabled
            logoEnabled
            onPress={(feature) => {
              const [longitude, latitude] = (feature.geometry as { coordinates: number[] }).coordinates;
              place({ latitude, longitude });
            }}
          >
            <Camera
              centerCoordinate={[(cameraCenter ?? pin).longitude, (cameraCenter ?? pin).latitude]}
              zoomLevel={15}
              animationDuration={400}
            />
            <PointAnnotation
              id="incident-location"
              coordinate={[pin.longitude, pin.latitude]}
              draggable
              onDragEnd={(payload) => {
                const [longitude, latitude] = payload.geometry.coordinates;
                place({ latitude, longitude });
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
          name={captionIsWarning ? "alert-circle-outline" : "information-circle-outline"}
          size={15}
          color={captionIsWarning ? colors.status.pending : colors.textMuted}
        />
        <Text style={[styles.caption, captionIsWarning && styles.captionWarning]}>{caption}</Text>
      </View>

      <PrimaryButton
        label={t("common.next")}
        onPress={onNext}
        disabled={!coordinate}
        hint={granted && !coordinate ? (slow ? t("report.location.placePin") : t("report.location.waiting")) : undefined}
      />
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
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  permissionLabel: {
    ...typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
  },
  settingsLink: {
    ...typography.bodySm,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  rationale: {
    ...typography.meta,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },
  // 44px: the touch target a finger can actually grab and drag, versus the 28px
  // this was — a pin that's hard to pick up reads as a pin that doesn't work.
  pinOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // The brand teal at low alpha — the halo around the draggable pin.
    backgroundColor: "rgba(15,118,110,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  captionWarning: {
    color: colors.status.pending,
  },
});
