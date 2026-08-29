import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Camera, MapView, PointAnnotation, UserLocation } from "@rnmapbox/maps";

import { Badge } from "../../components/Badge";
import { Chip } from "../../components/Chip";
import { useIncidentStore } from "../incident/incidentStore";
import { colors, radii, spacing } from "../../theme/colors";
import { Coordinate, ensureForegroundPermission, getCurrentPosition } from "./locationService";

type Urgency = "low" | "medium" | "high" | "critical";
type IncidentStatus = "reported" | "claimed";

type MapIncident = {
  id: string;
  title: string;
  urgency: Urgency;
  status: IncidentStatus;
  coordinate: Coordinate;
};

// Falls back to central Colombo when location is unavailable or denied.
const DEFAULT_CENTER: Coordinate = { latitude: 6.9271, longitude: 79.8612 };

const URGENCY_LABEL: Record<Urgency, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const STATUS_FILTERS = ["All", "Reported", "Claimed"];
const URGENCY_FILTERS = ["All", "Low", "Medium", "High", "Critical"];

/**
 * Placeholder pins, offset from wherever the map is centred so they stay visible
 * during a demo. Replaced in Phase 2 by GET /v1/incidents/nearby, which takes the
 * same centre point as lat/lng query params.
 */
function buildPlaceholderIncidents(center: Coordinate): MapIncident[] {
  const offsets: { dLat: number; dLng: number; title: string; urgency: Urgency; status: IncidentStatus }[] = [
    { dLat: 0.006, dLng: -0.004, title: "Illegal dumping near canal bank", urgency: "critical", status: "reported" },
    { dLat: 0.004, dLng: 0.007, title: "Cleared debris pile", urgency: "low", status: "claimed" },
    { dLat: -0.003, dLng: 0.005, title: "Oil sheen on lake surface", urgency: "high", status: "claimed" },
    { dLat: -0.006, dLng: -0.006, title: "Overflowing storm drain", urgency: "medium", status: "reported" },
  ];

  return offsets.map((offset, index) => ({
    id: String(index + 1),
    title: offset.title,
    urgency: offset.urgency,
    status: offset.status,
    coordinate: {
      latitude: center.latitude + offset.dLat,
      longitude: center.longitude + offset.dLng,
    },
  }));
}

function distanceKm(from: Coordinate, to: Coordinate): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function IncidentMapScreen() {
  const navigation = useNavigation();
  const pendingCount = useIncidentStore((state) => state.queue.length);

  const [center, setCenter] = useState<Coordinate | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");

  // Location is requested here, on first map view - the point of use, per
  // SRS 3.4.9. A denied prompt still yields a usable map, just not centred
  // on the user.
  useEffect(() => {
    let active = true;

    (async () => {
      const granted = await ensureForegroundPermission();
      if (!active) return;

      if (!granted) {
        setCenter(DEFAULT_CENTER);
        return;
      }

      const position = await getCurrentPosition();
      if (!active) return;

      setCenter(position?.coordinate ?? DEFAULT_CENTER);
      setHasLocation(!!position);
    })();

    return () => {
      active = false;
    };
  }, []);

  const incidents = useMemo(() => (center ? buildPlaceholderIncidents(center) : []), [center]);

  const visibleIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          (statusFilter === "All" || incident.status === statusFilter.toLowerCase()) &&
          (urgencyFilter === "All" || incident.urgency === urgencyFilter.toLowerCase())
      ),
    [incidents, statusFilter, urgencyFilter]
  );

  const selected = visibleIncidents.find((incident) => incident.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      {center ? (
        <MapView style={styles.map} scaleBarEnabled={false} onPress={() => setSelectedId(null)}>
          <Camera defaultSettings={{ centerCoordinate: [center.longitude, center.latitude], zoomLevel: 13 }} />
          {hasLocation ? <UserLocation /> : null}

          {visibleIncidents.map((incident) => (
            <PointAnnotation
              key={incident.id}
              id={`incident-${incident.id}`}
              coordinate={[incident.coordinate.longitude, incident.coordinate.latitude]}
              onSelected={() => setSelectedId(incident.id)}
            >
              <View style={[styles.pin, { backgroundColor: colors.urgency[incident.urgency] }]} />
            </PointAnnotation>
          ))}
        </MapView>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator />
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>EcoTrack</Text>
        <Pressable style={styles.iconButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {pendingCount > 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {pendingCount} report{pendingCount === 1 ? "" : "s"} pending · waiting for connection.
          </Text>
        </View>
      ) : null}

      <Pressable style={styles.fab} onPress={() => navigation.getParent()?.navigate("ReportModal" as never)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {selected ? (
        <View style={styles.popup}>
          <View style={styles.popupThumbnail} />
          <View style={styles.popupBody}>
            <Text style={styles.popupTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <View style={styles.popupMeta}>
              <Badge
                label={URGENCY_LABEL[selected.urgency]}
                backgroundColor={colors.urgency[selected.urgency]}
                textColor="#FFFFFF"
              />
              {center ? (
                <Text style={styles.popupDistance}>
                  {distanceKm(center, selected.coordinate).toFixed(1)} km
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.popupButton}>
              <Text style={styles.popupButtonLabel}>View Details</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filter Incidents</Text>

          <Text style={styles.sheetLabel}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUS_FILTERS.map((status) => (
              <Chip key={status} label={status} selected={status === statusFilter} onPress={() => setStatusFilter(status)} />
            ))}
          </View>

          <Text style={styles.sheetLabel}>URGENCY</Text>
          <View style={styles.chipRow}>
            {URGENCY_FILTERS.map((level) => (
              <Chip key={level} label={level} selected={level === urgencyFilter} onPress={() => setUrgencyFilter(level)} />
            ))}
          </View>

          <Pressable style={styles.applyButton} onPress={() => setFilterVisible(false)}>
            <Text style={styles.applyButtonLabel}>Apply</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDEDE6",
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowRadius: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  banner: {
    position: "absolute",
    top: spacing.lg + 56,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  popup: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  popupThumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: "#E5E5DC",
  },
  popupBody: {
    flex: 1,
    gap: spacing.xs,
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  popupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  popupDistance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  popupButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  popupButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sheetLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  applyButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
