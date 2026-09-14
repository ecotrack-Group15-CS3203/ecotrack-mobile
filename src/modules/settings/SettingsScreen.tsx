import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { useMe, useUpdateProfile } from "../auth/useMe";
import { useAsgardeoAuth } from "../auth/useAsgardeoAuth";
import { colors, radii, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition, LOCATION_RATIONALE } from "../map/locationService";
import type { IncidentSeverity } from "../../types/api";

const RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: "1 km", meters: 1000 },
  { label: "5 km", meters: 5000 },
  { label: "10 km", meters: 10000 },
  { label: "25 km", meters: 25000 },
  { label: "50 km", meters: 50000 },
];

const URGENCY_OPTIONS: { label: string; value: IncidentSeverity }[] = [
  { label: "All", value: "low" },
  { label: "Medium+", value: "medium" },
  { label: "High+", value: "high" },
  { label: "Critical only", value: "critical" },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const { signOut } = useAsgardeoAuth();
  const updateProfileMutation = useUpdateProfile();

  const [locationError, setLocationError] = useState<string | null>(null);

  const email = me?.email ?? "";
  const displayName = me?.fullName || "EcoTrack user";
  const initial = displayName.charAt(0).toUpperCase();

  async function handleRadiusChange(meters: number) {
    setLocationError(null);

    // The alert centre is a one-time snapshot, not continuous tracking — only
    // captured the first time a radius is set (see LOCATION_RATIONALE.alertCenter).
    if (me?.alertCenterSet) {
      updateProfileMutation.mutate({ notificationRadiusMeters: meters });
      return;
    }

    const granted = await ensureForegroundPermission();
    if (!granted) {
      setLocationError(LOCATION_RATIONALE.alertCenter);
      return;
    }
    const fix = await getCurrentPosition();
    if (!fix) {
      setLocationError("Couldn't determine your location. Please try again.");
      return;
    }
    updateProfileMutation.mutate({
      notificationRadiusMeters: meters,
      alertCenter: { lat: fix.coordinate.latitude, lng: fix.coordinate.longitude },
    });
  }

  function handleUrgencyChange(value: IncidentSeverity) {
    updateProfileMutation.mutate({ notificationMinUrgency: value });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>Profile</Text>

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

      <Pressable
        onPress={() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate("MyReports")
        }
      >
        <Card style={styles.linkRow}>
          <Text style={styles.linkLabel}>My Reports</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      {!me?.organisation ? (
        <Pressable
          onPress={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate("OrganisationDirectory")
          }
        >
          <Card style={styles.linkRow}>
            <Text style={styles.linkLabel}>Find an Organization</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ) : null}

      {me?.organisation ? (
        <Card>
          <Text style={styles.cardLabel}>ORGANIZATION</Text>
          <Text style={styles.orgName}>{me.organisation.name}</Text>
        </Card>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>NOTIFICATION RADIUS</Text>
        {updateProfileMutation.isPending ? <ActivityIndicator size="small" /> : null}
      </View>
      <View style={styles.chipRow}>
        {RADIUS_OPTIONS.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            selected={me?.notificationRadiusMeters === option.meters}
            onPress={() => handleRadiusChange(option.meters)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>MINIMUM NOTIFICATION URGENCY</Text>
      <View style={styles.chipRow}>
        {URGENCY_OPTIONS.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            selected={me?.notificationMinUrgency === option.value}
            onPress={() => handleUrgencyChange(option.value)}
          />
        ))}
      </View>

      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
      {updateProfileMutation.isError ? (
        <Text style={styles.errorText}>{toApiError(updateProfileMutation.error).message}</Text>
      ) : null}

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutLabel}>Log Out</Text>
      </Pressable>

      <Pressable
        style={styles.deleteAccountButton}
        onPress={() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate("DeleteAccount")
        }
      >
        <Text style={styles.deleteAccountLabel}>Delete Account</Text>
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
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -spacing.sm,
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
  errorText: {
    fontSize: 13,
    color: colors.danger,
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
  deleteAccountButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  deleteAccountLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
