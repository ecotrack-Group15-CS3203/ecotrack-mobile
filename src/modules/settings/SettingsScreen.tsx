import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Segmented } from "../../components/Segmented";
import { SectionLabel } from "../../components/SectionLabel";
import { StatRow, StatTile } from "../../components/StatTile";
import { useMembershipWatch } from "../auth/membershipWatch";
import { useMe, useUpdateProfile } from "../auth/useMe";
import { useAsgardeoAuth } from "../auth/useAsgardeoAuth";
import { useMyReportCount } from "../incident/useMyReports";
import { useCompletedTaskCount } from "../task/useTasks";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { tones } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition, LOCATION_RATIONALE } from "../map/locationService";
import type { IncidentSeverity } from "../../types/api";

// SRS §3.1.4 fixes both option sets; the API rejects any other radius with a 400.
const RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: "1 km", meters: 1000 },
  { label: "5 km", meters: 5000 },
  { label: "10 km", meters: 10000 },
  { label: "25 km", meters: 25000 },
  { label: "50 km", meters: 50000 },
];

const URGENCY_OPTIONS: { key: string; value: IncidentSeverity }[] = [
  { key: "profile.urgency.all", value: "low" },
  { key: "profile.urgency.mediumPlus", value: "medium" },
  { key: "profile.urgency.highPlus", value: "high" },
  { key: "profile.urgency.criticalOnly", value: "critical" },
];

export function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const { signOut } = useAsgardeoAuth();
  const updateProfileMutation = useUpdateProfile();
  // Set when a join request is submitted, cleared once the membership lands —
  // the same flag that makes useMe() poll while a decision is outstanding.
  const awaitingMembership = useMembershipWatch((state) => state.awaitingSince) !== null;

  // Mounted here only: neither is prefetched at launch (SRS §3.4.3).
  const reportCount = useMyReportCount();
  const completedTaskCount = useCompletedTaskCount();

  const [locationError, setLocationError] = useState<string | null>(null);

  const displayName = me?.fullName || t("profile.fallbackName");
  const organisation = me?.organisation ?? null;

  function openDirectory() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate("OrganisationDirectory");
  }

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
      setLocationError(t("profile.locationFailed"));
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
      // A tap on a control while something else has focus should land, not just
      // dismiss the keyboard first.
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={t("profile.title")} style={styles.header} />

      <Card style={styles.identityCard}>
        <Avatar name={displayName} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {me?.email ?? ""}
          </Text>
          {/* The role as the server reports it. The mockups show a Volunteer/Citizen
              toggle here, but role is a single server-resolved value (a volunteer
              already holds every citizen capability, and multi-org membership is
              rejected — SRS §3.1.1), so a switch would have nothing to switch. */}
          {me ? (
            <View style={styles.roleBadge}>
              <Badge
                label={
                  organisation ? t("profile.role.volunteer", { org: organisation.name }) : t("profile.role.citizen")
                }
                tone={organisation ? tones.resolved : tones.neutral}
                dot={false}
              />
            </View>
          ) : null}
        </View>
      </Card>

      {/* Real numbers only. "Events attended" isn't derivable (RSVP is not attendance,
          and there is no per-user RSVP history) and there is no quantity field for
          "kg cleaned" anywhere in the schema, so neither tile exists. */}
      <StatRow>
        <StatTile
          label={t("profile.stats.reportsFiled")}
          value={reportCount.data ?? 0}
          icon="document-text-outline"
          loading={reportCount.isLoading}
        />
        {organisation ? (
          <StatTile
            label={t("profile.stats.tasksCompleted")}
            value={completedTaskCount.data ?? 0}
            icon="checkmark-done-outline"
            tone={tones.resolved}
            loading={completedTaskCount.isLoading}
          />
        ) : null}
      </StatRow>

      {!organisation ? (
        <Card style={styles.unlocksCard}>
          <View style={styles.unlocksHeader}>
            <View style={styles.unlocksIcon}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.unlocksTitle}>{t("profile.unlocks.title")}</Text>
          </View>
          <Text style={styles.unlocksBody}>{t("profile.unlocks.body")}</Text>
          <PrimaryButton label={t("profile.unlocks.cta")} size="sm" onPress={openDirectory} />
        </Card>
      ) : null}

      {/* Until the decision lands there is nothing in `me` to show for a submitted
          request, so this is the only acknowledgement the user gets that it's still
          open — and it disappears by itself the moment the approval arrives and the
          volunteer tabs appear. */}
      {!organisation && awaitingMembership ? (
        <Card style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Ionicons name="hourglass-outline" size={17} color={colors.status.pending} />
            <Text style={styles.pendingTitle}>{t("profile.pendingJoin.title")}</Text>
          </View>
          <Text style={styles.pendingBody}>{t("profile.pendingJoin.body")}</Text>
        </Card>
      ) : null}

      <SectionLabel
        label={t("profile.radius.title")}
        trailing={updateProfileMutation.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        style={styles.sectionLabel}
      />
      <Segmented
        options={RADIUS_OPTIONS.map((option) => ({ value: String(option.meters), label: option.label }))}
        value={String(me?.notificationRadiusMeters ?? "")}
        onChange={(value) => void handleRadiusChange(Number(value))}
        accessibilityLabel={t("profile.radius.title")}
      />

      <SectionLabel label={t("profile.urgency.title")} style={styles.sectionLabel} />
      <View style={styles.chipRow}>
        {URGENCY_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={t(option.key)}
            selected={me?.notificationMinUrgency === option.value}
            onPress={() => handleUrgencyChange(option.value)}
          />
        ))}
      </View>

      {locationError ? <ErrorBanner message={locationError} /> : null}
      {updateProfileMutation.isError ? (
        <ErrorBanner message={toApiError(updateProfileMutation.error).message} />
      ) : null}

      <PrimaryButton label={t("profile.logOut")} variant="secondary" icon="log-out-outline" onPress={signOut} />

      <Pressable
        style={styles.deleteAccountButton}
        onPress={() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate("DeleteAccount")
        }
        accessibilityRole="button"
      >
        <Text style={styles.deleteAccountLabel}>{t("profile.deleteAccount")}</Text>
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
    gap: 2,
  },
  name: {
    ...typography.h3,
    fontSize: 17,
    textTransform: "capitalize",
  },
  email: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  roleBadge: {
    marginTop: spacing.xs,
  },
  unlocksCard: {
    gap: spacing.sm,
  },
  unlocksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  unlocksIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  unlocksTitle: {
    flex: 1,
    ...typography.h3,
    fontSize: 15,
  },
  unlocksBody: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
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
