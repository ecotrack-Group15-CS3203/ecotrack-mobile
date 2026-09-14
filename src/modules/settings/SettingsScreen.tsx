import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { useMe } from "../auth/useMe";
import { useAsgardeoAuth } from "../auth/useAsgardeoAuth";
import { colors, radii, spacing } from "../../theme/colors";

const RADIUS_OPTIONS = ["1 km", "5 km", "10 km", "25 km", "50 km"];
const URGENCY_OPTIONS = ["All", "Medium+", "High+", "Critical only"];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { signOut } = useAsgardeoAuth();

  const [previewRole, setPreviewRole] = useState<"citizen" | "volunteer">("citizen");
  const [radius, setRadius] = useState("10 km");
  const [urgencyThreshold, setUrgencyThreshold] = useState("High+");
  const [simulateOffline, setSimulateOffline] = useState(false);

  const email = me?.email ?? "";
  const displayName = me?.fullName || "EcoTrack user";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>PREVIEW ROLE (for review)</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewValue}>{previewRole === "citizen" ? "Citizen" : "Volunteer"}</Text>
          <Pressable
            style={styles.previewButton}
            onPress={() => setPreviewRole((role) => (role === "citizen" ? "volunteer" : "citizen"))}
          >
            <Text style={styles.previewButtonLabel}>
              {previewRole === "citizen" ? "Volunteer" : "Citizen"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={styles.cardLabel}>ORGANIZATION</Text>
        <Text style={styles.orgName}>Kelani Watch Collective</Text>
      </Card>

      <Text style={styles.sectionLabel}>NOTIFICATION RADIUS</Text>
      <View style={styles.chipRow}>
        {RADIUS_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={option === radius} onPress={() => setRadius(option)} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>MINIMUM NOTIFICATION URGENCY</Text>
      <View style={styles.chipRow}>
        {URGENCY_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={option === urgencyThreshold}
            onPress={() => setUrgencyThreshold(option)}
          />
        ))}
      </View>

      <Card style={styles.offlineRow}>
        <Text style={styles.offlineLabel}>Simulate offline mode</Text>
        <Switch value={simulateOffline} onValueChange={setSimulateOffline} />
      </Card>

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutLabel}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  previewCard: {
    backgroundColor: "#EEEEE6",
    borderRadius: radii.md,
    padding: spacing.md,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  previewButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  previewButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 4,
  },
  orgName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: -spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offlineLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutLabel: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 15,
  },
});
