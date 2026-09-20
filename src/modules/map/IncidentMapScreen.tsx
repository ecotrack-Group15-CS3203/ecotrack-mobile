import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, MapView, PointAnnotation, UserLocation } from "@rnmapbox/maps";

import { Badge } from "../../components/Badge";
import { Chip } from "../../components/Chip";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionLabel } from "../../components/SectionLabel";
import { SEVERITY_LABEL } from "../incident/incidentLabels";
import { QueueBanner } from "../incident/QueueBanner";
import { useNearbyIncidents } from "../incident/useIncidents";
import { useNotificationInbox } from "../notifications/useNotifications";
import { colors, radii, shadows, spacing, typography } from "../../theme/colors";
import { urgencyTone } from "../../theme/tones";
import type { IncidentSeverity } from "../../types/api";
import { Coordinate, DEFAULT_MAP_CENTER, ensureForegroundPermission, getCurrentPosition } from "./locationService";

type IncidentStatus = "reported" | "claimed";


// Matches the fixed set of radii the Settings screen offers, in metres. 10km
// is the same default the backend applies when this param is omitted.
const SEARCH_RADIUS_METERS = 10_000;

const STATUS_FILTERS = ["All", "Reported", "Claimed"];
const URGENCY_FILTERS = ["All", "Low", "Medium", "High", "Critical"];

export function IncidentMapScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: inbox } = useNotificationInbox();
  const unreadCount = inbox?.items.filter((n) => !n.isRead).length ?? 0;

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
        setCenter(DEFAULT_MAP_CENTER);
        return;
      }

      const position = await getCurrentPosition();
      if (!active) return;

      setCenter(position?.coordinate ?? DEFAULT_MAP_CENTER);
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {center && incidentsLoading ? (
        <View style={[styles.loadingChip, { top: insets.top + spacing.xl + 48 }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}

      <View style={[styles.header, { top: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>EcoTrack</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigation.getParent() as any)?.navigate("NotificationInbox")
            }
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setFilterVisible(true)}>
            <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.banner, { top: insets.top + spacing.sm + 52 }]} pointerEvents="box-none">
        <QueueBanner />
      </View>

      <Pressable style={styles.fab} onPress={() => navigation.getParent()?.navigate("ReportModal" as never)}>
        <Ionicons name="add" size={28} color={colors.onPrimary} />
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
              <Badge label={SEVERITY_LABEL[selected.severity]} tone={urgencyTone(selected.severity)} />
              <Text style={styles.popupDistance}>{(selected.distanceMeters / 1000).toFixed(1)} km</Text>
            </View>
            <PrimaryButton
              label="View Details"
              size="sm"
              style={styles.popupButton}
              onPress={() =>
                // No app-wide navigation param typing exists yet (every screen
                // in this codebase navigates via untyped string names) — `any`
                // here matches that, not a new gap.
                (navigation.getParent() as any)?.navigate("IncidentDetail", { incidentId: selected.id })
              }
            />
          </View>
        </View>
      ) : null}

      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filter Incidents</Text>

          <SectionLabel label="Status" style={styles.sheetLabel} />
          <View style={styles.chipRow}>
            {STATUS_FILTERS.map((status) => (
              <Chip key={status} label={status} selected={status === statusFilter} onPress={() => setStatusFilter(status)} />
            ))}
          </View>

          <SectionLabel label="Urgency" style={styles.sheetLabel} />
          <View style={styles.chipRow}>
            {URGENCY_FILTERS.map((level) => (
              <Chip key={level} label={level} selected={level === urgencyFilter} onPress={() => setUrgencyFilter(level)} />
            ))}
          </View>

          <PrimaryButton label="Apply" onPress={() => setFilterVisible(false)} style={styles.applyButton} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.sm,
    ...shadows.card,
  },
  header: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    ...typography.h2,
    // The map behind it can be any colour, so the wordmark carries its own
    // halo rather than relying on the tiles staying light.
    textShadowColor: "rgba(255,255,255,0.95)",
    textShadowRadius: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    // `--marker-ring` on the web: a white ring keeps a pin readable against
    // dark satellite tiles as well as light ones.
    borderColor: colors.surface,
  },
  banner: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
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
    ...shadows.pop,
  },
  popup: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.pop,
  },
  popupThumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  popupBody: {
    flex: 1,
    gap: spacing.xs,
  },
  popupTitle: {
    ...typography.h3,
    fontSize: 15,
  },
  popupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  popupDistance: {
    ...typography.meta,
    fontSize: 12,
  },
  popupButton: {
    marginTop: spacing.xs,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
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
    ...typography.h3,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  sheetLabel: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  applyButton: {
    marginTop: spacing.sm,
  },
});
