import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionLabel } from "../../components/SectionLabel";
import { useMembershipWatch } from "../auth/membershipWatch";
import { useMe, useUpdateProfile } from "../auth/useMe";
import { useAsgardeoAuth } from "../auth/useAsgardeoAuth";
import { colors, radii, spacing, typography } from "../../theme/colors";
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
  // Set when a join request is submitted, cleared once the membership lands —
  // the same flag that makes useMe() poll while a decision is outstanding.
  const awaitingMembership = useMembershipWatch((state) => state.awaitingSince) !== null;

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
      <ScreenHeader title="Profile" style={styles.header} />

      <Card style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </Card>

      <Pressable
        onPress={() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate("MyReports")
        }
      >
        <Card style={styles.linkRow}>
          <View style={styles.linkIcon}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </View>
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
            <View style={styles.linkIcon}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.linkLabel}>Find an Organization</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ) : null}

      {/* Until the decision lands there is nothing in `me` to show for a
          submitted request, so this is the only acknowledgement the user gets
          that it's still open — and it disappears by itself the moment the
          approval arrives and the volunteer tabs appear. */}
      {!me?.organisation && awaitingMembership ? (
        <Card style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Ionicons name="hourglass-outline" size={17} color={colors.status.pending} />
            <Text style={styles.pendingTitle}>Join request pending</Text>
          </View>
          <Text style={styles.pendingBody}>
            An organization admin still has to approve it. You'll be notified, and your volunteer tabs
            appear here as soon as it's approved.
          </Text>
        </Card>
      ) : null}

      {me?.organisation ? (
        <Card style={styles.orgCard}>
          <SectionLabel label="Organization" />
          <Text style={styles.orgName}>{me.organisation.name}</Text>
          <Text style={styles.orgRole}>Volunteer</Text>
        </Card>
      ) : null}

      <SectionLabel
        label="Notification radius"
        trailing={updateProfileMutation.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        style={styles.sectionLabel}
      />
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

      <SectionLabel label="Minimum notification urgency" style={styles.sectionLabel} />
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

      {locationError ? <ErrorBanner message={locationError} /> : null}
      {updateProfileMutation.isError ? (
        <ErrorBanner message={toApiError(updateProfileMutation.error).message} />
      ) : null}

      <PrimaryButton label="Log Out" variant="secondary" icon="log-out-outline" onPress={signOut} />

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
  header: {
    marginBottom: 0,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
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
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  name: {
    ...typography.h3,
    fontSize: 16,
    textTransform: "capitalize",
  },
  email: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: {
    flex: 1,
    ...typography.body,
    fontWeight: "600",
  },
  pendingCard: {
    gap: spacing.sm,
    backgroundColor: colors.status.pendingTint,
    borderColor: colors.status.pending,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pendingTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.status.pending,
  },
  pendingBody: {
    ...typography.meta,
    color: colors.status.pending,
    lineHeight: 18,
  },
  orgCard: {
    gap: spacing.xs,
  },
  orgName: {
    ...typography.body,
    fontWeight: "600",
  },
  orgRole: typography.meta,
  sectionLabel: {
    marginBottom: -spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  deleteAccountButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  deleteAccountLabel: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
