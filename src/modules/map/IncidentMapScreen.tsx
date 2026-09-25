import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, MapView, PointAnnotation, UserLocation } from "@rnmapbox/maps";

import { Badge } from "../../components/Badge";
import { BrandLockup } from "../../components/brand/BrandLockup";
import { Chip } from "../../components/Chip";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionLabel } from "../../components/SectionLabel";
import { ThumbPlaceholder } from "../../components/ThumbPlaceholder";
import { useMe } from "../auth/useMe";
import { categoryKey, CATEGORY_ICON, severityKey } from "../incident/incidentLabels";
import { QueueBanner } from "../incident/QueueBanner";
import { useNearbyIncidents } from "../incident/useIncidents";
import { useNotificationInbox } from "../notifications/useNotifications";
import { colors, radii, shadows, spacing, typography } from "../../theme/colors";
import { urgencyTone } from "../../theme/tones";
import type { IncidentSeverity, NearbyIncident } from "../../types/api";
import {
  Coordinate,
  DEFAULT_MAP_CENTER,
  ensureForegroundPermission,
  getBalancedFix,
  getLastKnownFix,
} from "./locationService";
import { firstName, formatDistance, greetingPeriod, timeAgo } from "./mapFormat";

type StatusFilter = "all" | "reported" | "claimed";
type UrgencyFilter = "all" | IncidentSeverity;

// Matches the fixed set of radii the Settings screen offers, in metres. 10km
// is the same default the backend applies when this param is omitted.
const SEARCH_RADIUS_METERS = 10_000;

const STATUS_FILTERS: { value: StatusFilter; key: string }[] = [
  { value: "all", key: "map.filters.all" },
  { value: "reported", key: "map.filters.awaitingClaim" },
  { value: "claimed", key: "map.filters.claimed" },
];
const URGENCY_FILTERS: UrgencyFilter[] = ["all", "low", "medium", "high", "critical"];

/** How long the map waits for a position before opening at the fallback centre. */
const FIX_FALLBACK_MS = 3_000;
/** A live fix only replaces an earlier one that is at least this far off (in
 * degrees, ~1 km) — otherwise the camera would twitch on every refinement. */
const RECENTRE_DEGREES = 0.01;

/** Rows in the "Closest to you" panel: one peeking, three when expanded. */
const PEEK_ROWS = 1;
const EXPANDED_ROWS = 3;
/** Clears the report FAB so the panel and popup sit above it, and — more to the
 * point — above the Mapbox logo/attribution at the bottom-left, which SRS §3.11.4
 * requires to stay visible. */
const ABOVE_FAB = spacing.lg + 56 + spacing.md;

export function IncidentMapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { data: inbox } = useNotificationInbox();
  const unreadCount = inbox?.items.filter((n) => !n.isRead).length ?? 0;

  const [center, setCenter] = useState<Coordinate | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const hasRealFix = useRef(false);

  // Location is requested here, on first map view - the point of use, per SRS 3.4.9.
  // A denied prompt still yields a usable map, just not centred on the user.
  //
  // The map used to render nothing until a high-accuracy fix came back, which on a
  // cold GPS chip is 5-30 s of spinner on the launch screen (SRS §3.4.3: 3 s to an
  // interactive home screen). Now: the OS's cached position opens the map at once,
  // a balanced live fix refines it, and after FIX_FALLBACK_MS it opens at the
  // fallback centre regardless.
  useEffect(() => {
    let active = true;
    const fallbackTimer = setTimeout(() => {
      if (active) setCenter((current) => current ?? DEFAULT_MAP_CENTER);
    }, FIX_FALLBACK_MS);

    const applyFix = (coordinate: Coordinate) => {
      if (!active) return;
      setCenter((current) => {
        const isFarOff =
          !current ||
          Math.abs(current.latitude - coordinate.latitude) > RECENTRE_DEGREES ||
          Math.abs(current.longitude - coordinate.longitude) > RECENTRE_DEGREES;
        return !hasRealFix.current || isFarOff ? coordinate : current;
      });
      hasRealFix.current = true;
    };

    (async () => {
      const granted = await ensureForegroundPermission();
      if (!active) return;

      if (!granted) {
        setCenter(DEFAULT_MAP_CENTER);
        return;
      }
      setHasLocation(true);

      void getLastKnownFix().then((fix) => fix && applyFix(fix.coordinate));
      const live = await getBalancedFix();
      if (live) applyFix(live.coordinate);
    })();

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  const { data: incidents = [], isLoading: incidentsLoading } = useNearbyIncidents(
    center?.latitude ?? null,
    center?.longitude ?? null,
    SEARCH_RADIUS_METERS,
  );

  const visibleIncidents = useMemo(
    () =>
      incidents
        .filter((incident) => {
          const status: StatusFilter = incident.claimed ? "claimed" : "reported";
          return (
            (statusFilter === "all" || status === statusFilter) &&
            (urgencyFilter === "all" || incident.severity === urgencyFilter)
          );
        })
        // The API already orders by distance; sorted again here so the panel's
        // "closest" never depends on that staying true.
        .sort((a, b) => a.distanceMeters - b.distanceMeters),
    [incidents, statusFilter, urgencyFilter],
  );

  const selected = visibleIncidents.find((incident) => incident.id === selectedId) ?? null;
  const name = firstName(me?.fullName);
  const period = greetingPeriod(new Date().getHours());
  // The brand row already names the app, so a nameless user just gets the plain greeting.
  const greeting = name ? t(`map.greeting.${period}`, { name }) : t(`map.greetingPlain.${period}`);

  function openIncident(incident: NearbyIncident) {
    // No app-wide navigation param typing exists yet (every screen in this codebase
    // navigates via untyped string names) — `any` here matches that, not a new gap.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.getParent() as any)?.navigate("IncidentDetail", { incidentId: incident.id });
  }

  const panelRows = visibleIncidents.slice(0, panelExpanded ? EXPANDED_ROWS : PEEK_ROWS);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <BrandLockup markSize={32} layout="inline" showTagline={false} />
        <View style={styles.greetingRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={2}>
              {greeting}
            </Text>
            <Text style={styles.subline} numberOfLines={1}>
              {center && !incidentsLoading
                ? t("map.nearby", { count: visibleIncidents.length })
                : t("map.searching")}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={t("map.notifications")}
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation.getParent() as any)?.navigate("NotificationInbox")
              }
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
            </Pressable>
            <Pressable
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={t("map.filters.title")}
              onPress={() => setFilterVisible(true)}
            >
              <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* The same urgency state the filter sheet writes — an accelerator, not a
            replacement for it (SRS §3.1.3 mandates the bottom sheet). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroller}
          contentContainerStyle={styles.pills}
          keyboardShouldPersistTaps="handled"
        >
          {URGENCY_FILTERS.map((level) => (
            <Chip
              key={level}
              label={level === "all" ? t("map.filters.all") : t(severityKey(level))}
              selected={urgencyFilter === level}
              tone={level === "all" ? undefined : urgencyTone(level)}
              onPress={() => setUrgencyFilter(level)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapCard}>
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
            <Camera centerCoordinate={[center.longitude, center.latitude]} zoomLevel={13} animationDuration={0} />
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
        <View style={styles.mapOverlay} pointerEvents="box-none">
          <QueueBanner />
        </View>
      </View>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.getParent()?.navigate("ReportModal" as never)}
        accessibilityRole="button"
        accessibilityLabel={t("nav.report")}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      {selected ? (
        <View style={[styles.popup, { bottom: ABOVE_FAB }]}>
          <ThumbPlaceholder
            seed={selected.id}
            uri={selected.thumbnailUrl}
            width={56}
            height={56}
            icon={CATEGORY_ICON[selected.category]}
          />
          <View style={styles.popupBody}>
            <Text style={styles.popupTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <View style={styles.popupMeta}>
              <Badge label={t(severityKey(selected.severity))} tone={urgencyTone(selected.severity)} />
              <Text style={styles.popupDistance}>
                {t("map.distanceAway", { distance: formatDistance(selected.distanceMeters) })}
              </Text>
            </View>
            <PrimaryButton
              label={t("map.viewDetails")}
              size="sm"
              style={styles.popupButton}
              onPress={() => openIncident(selected)}
            />
          </View>
        </View>
      ) : center ? (
        <View style={[styles.panel, { bottom: ABOVE_FAB }]}>
          <Pressable
            style={styles.panelHeader}
            onPress={() => setPanelExpanded((expanded) => !expanded)}
            accessibilityRole="button"
            accessibilityState={{ expanded: panelExpanded }}
          >
            <Text style={styles.panelTitle}>{t("map.closest")}</Text>
            <Ionicons name={panelExpanded ? "chevron-down" : "chevron-up"} size={18} color={colors.textMuted} />
          </Pressable>

          {panelRows.length === 0 ? (
            <Text style={styles.panelEmpty}>{incidentsLoading ? t("map.searching") : t("map.closestEmpty")}</Text>
          ) : (
            panelRows.map((incident) => (
              <Pressable
                key={incident.id}
                style={styles.panelRow}
                onPress={() => openIncident(incident)}
                accessibilityRole="button"
              >
                <ThumbPlaceholder
                  seed={incident.id}
                  uri={incident.thumbnailUrl}
                  width={48}
                  height={48}
                  icon={CATEGORY_ICON[incident.category]}
                />
                <View style={styles.panelRowBody}>
                  <Text style={styles.panelRowTitle} numberOfLines={1}>
                    {incident.title}
                  </Text>
                  <Text style={styles.panelRowMeta} numberOfLines={1}>
                    {[
                      t(categoryKey(incident.category)),
                      t("map.distanceAway", { distance: formatDistance(incident.distanceMeters) }),
                      timeAgo(incident.createdAt, t),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Badge label={t(severityKey(incident.severity))} tone={urgencyTone(incident.severity)} />
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t("map.filters.title")}</Text>

          <SectionLabel label={t("map.filters.status")} style={styles.sheetLabel} />
          <View style={styles.chipRow}>
            {STATUS_FILTERS.map((option) => (
              <Chip
                key={option.value}
                label={t(option.key)}
                selected={option.value === statusFilter}
                onPress={() => setStatusFilter(option.value)}
              />
            ))}
          </View>

          <SectionLabel label={t("map.filters.urgency")} style={styles.sheetLabel} />
          <View style={styles.chipRow}>
            {URGENCY_FILTERS.map((level) => (
              <Chip
                key={level}
                label={level === "all" ? t("map.filters.all") : t(severityKey(level))}
                selected={level === urgencyFilter}
                tone={level === "all" ? undefined : urgencyTone(level)}
                onPress={() => setUrgencyFilter(level)}
              />
            ))}
          </View>

          <PrimaryButton label={t("map.filters.apply")} onPress={() => setFilterVisible(false)} style={styles.applyButton} />
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
  // Solid header in normal flow above the map (not floating over it), so the
  // greeting gets the full width and can wrap to a second line.
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...typography.h1,
  },
  subline: {
    ...typography.bodySm,
    marginTop: spacing.xs,
  },
  // The map runs edge to edge under the header, down to the tab bar.
  mapCard: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  mapOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surfaceMuted,
  },
  // Bleeds to the screen edges so chips scroll off-screen rather than clipping
  // at the header padding.
  pillScroller: {
    marginHorizontal: -spacing.lg,
  },
  pills: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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
  panel: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    ...shadows.pop,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
  },
  panelTitle: {
    ...typography.h3,
    fontSize: 15,
  },
  panelEmpty: {
    ...typography.meta,
    paddingBottom: spacing.sm,
  },
  panelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  panelRowBody: {
    flex: 1,
    gap: 2,
  },
  panelRowTitle: {
    ...typography.body,
    fontWeight: "700",
  },
  panelRowMeta: {
    ...typography.meta,
    fontSize: 12,
  },
  popup: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.pop,
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
