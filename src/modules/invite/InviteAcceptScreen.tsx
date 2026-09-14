import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { colors, radii, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition, LOCATION_RATIONALE } from "../map/locationService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAcceptInvite, useInviteInfo } from "./useInvite";

type RouteParams = { token: string };

export function InviteAcceptScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute();
  const { token } = params as RouteParams;

  const { data: info, isLoading, isError } = useInviteInfo(token);
  const acceptMutation = useAcceptInvite(token);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function handleAccept() {
    setLocationError(null);

    const granted = await ensureForegroundPermission();
    if (!granted) {
      setLocationError(
        "EcoTrack needs your location to confirm you're within this organization's service area. Please allow location access and try again.",
      );
      return;
    }

    const fix = await getCurrentPosition();
    if (!fix) {
      setLocationError("Couldn't determine your location. Please try again.");
      return;
    }

    acceptMutation.mutate(
      { lat: fix.coordinate.latitude, lng: fix.coordinate.longitude },
      { onSuccess: () => navigation.goBack() },
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !info) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>Invite not found</Text>
        <Text style={styles.body}>This invite link doesn't exist, or the URL is incomplete.</Text>
      </View>
    );
  }

  // Three distinct invalid states, checked in a specific order: a link can be
  // both expired and exhausted, but "revoked" (an admin actively pulled it) is
  // the most specific/actionable thing to tell the user, ahead of the passive
  // "your usage window closed" ones.
  const invalidReason = info.revoked
    ? "This invite link has been revoked by the organization."
    : info.expired
      ? "This invite link has expired."
      : info.exhausted
        ? "This invite link has reached its usage limit."
        : null;

  if (invalidReason) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>{info.organisationName}</Text>
        <Card style={styles.invalidCard}>
          <Text style={styles.invalidText}>{invalidReason}</Text>
        </Card>
        <Text style={styles.body}>Ask the organization for a new invite link.</Text>
      </View>
    );
  }

  const mutationError = acceptMutation.error ? toApiError(acceptMutation.error) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.title}>Join {info.organisationName}</Text>
      <Card>
        <Text style={styles.consentText}>{LOCATION_RATIONALE.joinOrganization}</Text>
      </Card>
      {(locationError || mutationError) && (
        <Text style={styles.errorText}>{locationError ?? mutationError?.message}</Text>
      )}
      <PrimaryButton
        label="Confirm and join"
        onPress={handleAccept}
        loading={acceptMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  consentText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  invalidCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
  },
  invalidText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
});
