import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Camera, MapView, PointAnnotation, UserLocation } from "@rnmapbox/maps";

import { Badge } from "../../components/Badge";
import { Chip } from "../../components/Chip";
import { SEVERITY_LABEL } from "../incident/incidentLabels";
import { useIncidentStore } from "../incident/incidentStore";
import { useNearbyIncidents } from "../incident/useIncidents";
import { colors, radii, spacing } from "../../theme/colors";
import type { IncidentSeverity } from "../../types/api";
import { Coordinate, ensureForegroundPermission, getCurrentPosition } from "./locationService";

type IncidentStatus = "reported" | "claimed";

// Falls back to central Colombo when location is unavailable or denied.
const DEFAULT_CENTER: Coordinate = { latitude: 6.9271, longitude: 79.8612 };

// Matches the fixed set of radii the Settings screen offers, in metres. 10km
// is the same default the backend applies when this param is omitted.
const SEARCH_RADIUS_METERS = 10_000;

const STATUS_FILTERS = ["All", "Reported", "Claimed"];
const URGENCY_FILTERS = ["All", "Low", "Medium", "High", "Critical"];

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

  const { data: incidents = [], isLoading: incidentsLoading } = useNearbyIncidents(
    center?.latitude ?? null,
    center?.longitude ?? null,
    SEARCH_RADIUS_METERS,
  );

  const visibleIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const status: IncidentStatus = incident.claimed ? "claimed" : "reported";
        return (
          (statusFilter === "All" || status === statusFilter.toLowerCase()) &&
          (urgencyFilter === "All" || incident.severity === (urgencyFilter.toLowerCase() as IncidentSeverity))
        );
      }),
    [incidents, statusFilter, urgencyFilter],
  );

  const selected = visibleIncidents.find((incident) => incident.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      {center ? (
        <MapView
          style={styles.map}
          scaleBarEnabled={false}
          onPress={() => setSelectedId(null)}
          // Required attribution per Mapbox ToS and SRS §3.11.4 — kept explicit
          // rather than relying on the SDK default so it can't silently regress.
          attributionEnabled
          logoEnabled
        >
          <Camera defaultSettings={{ centerCoordinate: [center.longitude, center.latitude], zoomLevel: 13 }} />
          {hasLocation ? <UserLocation /> : null}

          {visibleIncidents.map((incident) => (
            <PointAnnotation
              key={incident.id}
              id={`incident-${incident.id}`}
              coordinate={[incident.lng, incident.lat]}
              onSelected={() => setSelectedId(incident.id)}
            >
              <View style={[styles.pin, { backgroundColor: colors.urgency[incident.severity] }]} />
            </PointAnnotation>
          ))}
        </MapView>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator />
        </View>
      )}

      {center && incidentsLoading ? (
        <View style={styles.loadingChip}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}

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
          {selected.thumbnailUrl ? (
            <Image source={{ uri: selected.thumbnailUrl }} style={styles.popupThumbnail} />
          ) : (
            <View style={styles.popupThumbnail} />
          )}
          <View style={styles.popupBody}>
            <Text style={styles.popupTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <View style={styles.popupMeta}>
              <Badge
                label={SEVERITY_LABEL[selected.severity]}
                backgroundColor={colors.urgency[selected.severity]}
                textColor="#FFFFFF"
              />
              <Text style={styles.popupDistance}>{(selected.distanceMeters / 1000).toFixed(1)} km</Text>
            </View>
            <Pressable
              style={styles.popupButton}
              onPress={() =>
                // No app-wide navigation param typing exists yet (every screen
                // in this codebase navigates via untyped string names) — `any`
                // here matches that, not a new gap.
                (navigation.getParent() as any)?.navigate("IncidentDetail", { incidentId: selected.id })
              }
            >
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
  loadingChip: {
    position: "absolute",
    top: spacing.lg,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
