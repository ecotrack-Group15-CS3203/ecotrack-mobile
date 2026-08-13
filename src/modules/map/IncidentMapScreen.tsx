import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { Badge } from "../../components/Badge";
import { Chip } from "../../components/Chip";
import { colors, radii, spacing } from "../../theme/colors";

type Urgency = "low" | "medium" | "high" | "critical";

type MockIncident = {
  id: string;
  title: string;
  urgency: Urgency;
  distanceKm: number;
  top: `${number}%`;
  left: `${number}%`;
};

const MOCK_INCIDENTS: MockIncident[] = [
  { id: "1", title: "Illegal dumping near canal bank", urgency: "critical", distanceKm: 0.4, top: "28%", left: "40%" },
  { id: "2", title: "Cleared debris pile", urgency: "low", distanceKm: 1.1, top: "35%", left: "76%" },
  { id: "3", title: "Oil sheen on lake surface", urgency: "high", distanceKm: 0.9, top: "52%", left: "68%" },
  { id: "4", title: "Overflowing storm drain", urgency: "medium", distanceKm: 1.6, top: "65%", left: "26%" },
];

const URGENCY_LABEL: Record<Urgency, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const STATUS_FILTERS = ["All", "Reported", "Claimed"];
const URGENCY_FILTERS = ["All", "Low", "Medium", "High", "Critical"];

export function IncidentMapScreen() {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");

  const selected = MOCK_INCIDENTS.find((incident) => incident.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <MapBackground />

      {MOCK_INCIDENTS.map((incident) => (
        <Pressable
          key={incident.id}
          onPress={() => setSelectedId(incident.id)}
          style={[styles.pin, { top: incident.top, left: incident.left, backgroundColor: colors.urgency[incident.urgency] }]}
        />
      ))}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>EcoTrack</Text>
        <Pressable style={styles.iconButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Pressable style={styles.fab} onPress={() => navigation.getParent()?.navigate("ReportModal" as never)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {selected ? (
        <View style={styles.popup}>
          <View style={styles.popupThumbnail} />
          <View style={styles.popupBody}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle} numberOfLines={1}>
                {selected.title}
              </Text>
            </View>
            <View style={styles.popupMeta}>
              <Badge
                label={URGENCY_LABEL[selected.urgency]}
                backgroundColor={colors.urgency[selected.urgency]}
                textColor="#FFFFFF"
              />
              <Text style={styles.popupDistance}>{selected.distanceKm} km</Text>
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

function MapBackground() {
  return (
    <View style={styles.mapBackground}>
      <View style={[styles.blob, { width: 220, height: 180, top: -40, left: -60, backgroundColor: "#DCE8D6" }]} />
      <View style={[styles.blob, { width: 200, height: 160, bottom: -30, right: -50, backgroundColor: "#DCE8D6" }]} />
      <View style={[styles.building, { top: "26%", left: "62%" }]} />
      <View style={[styles.building, { top: "44%", left: "10%" }]} />
      <View style={styles.river} />
      <View style={[styles.road, { top: "0%", left: "18%", height: "120%", transform: [{ rotate: "12deg" }] }]} />
      <View style={[styles.road, { top: "58%", left: "-10%", width: "90%", transform: [{ rotate: "-6deg" }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDEDE6",
    overflow: "hidden",
  },
  mapBackground: StyleSheet.absoluteFill,
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  building: {
    position: "absolute",
    width: 36,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#D8D8CE",
  },
  river: {
    position: "absolute",
    top: "38%",
    left: -40,
    width: "160%",
    height: 46,
    backgroundColor: "#BFE0F0",
    transform: [{ rotate: "-8deg" }],
  },
  road: {
    position: "absolute",
    width: 6,
    backgroundColor: "#FFFFFF",
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
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
  popupHeader: {
    flexDirection: "row",
  },
  popupTitle: {
    flex: 1,
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
