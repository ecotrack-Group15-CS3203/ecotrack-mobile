import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition, LOCATION_RATIONALE } from "../map/locationService";
import { useSubmitJoinRequest } from "./useOrganisations";

type RouteParams = { organisationId: string; organisationName: string };

export function JoinRequestScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { organisationId, organisationName } = params as RouteParams;

  const [message, setMessage] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const submitMutation = useSubmitJoinRequest();

  async function handleSubmit() {
    setLocationError(null);

    const granted = await ensureForegroundPermission();
    if (!granted) {
      setLocationError(LOCATION_RATIONALE.joinOrganization);
      return;
    }

    const fix = await getCurrentPosition();
    if (!fix) {
      setLocationError("Couldn't determine your location. Please try again.");
      return;
    }

    submitMutation.mutate(
      {
        organisationId,
        lat: fix.coordinate.latitude,
        lng: fix.coordinate.longitude,
        message: message.trim() || undefined,
      },
      { onSuccess: () => navigation.goBack() },
    );
  }

  const mutationError = submitMutation.error ? toApiError(submitMutation.error) : null;

  return (
    <View style={[styles.container, { paddingTop: spacing.xl }]}>
      <View>
        <Text style={styles.title}>Join {organisationName}</Text>
        <Text style={styles.subtitle}>
          An admin reviews your request — you'll be notified either way, and the app switches to your
          volunteer view as soon as it's approved.
        </Text>
      </View>

      <Card style={styles.consentCard}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={styles.consentText}>{LOCATION_RATIONALE.joinOrganization}</Text>
      </Card>

      <View>
        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Tell the organization why you'd like to join"
          placeholderTextColor={colors.textDisabled}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
      </View>

      {locationError || mutationError ? (
        <ErrorBanner message={locationError ?? mutationError?.message ?? ""} />
      ) : null}

      <PrimaryButton label="Submit Request" loading={submitMutation.isPending} onPress={handleSubmit} />
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
  title: typography.h1,
  subtitle: {
    marginTop: spacing.xs,
    ...typography.bodySm,
    lineHeight: 20,
  },
  consentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  consentText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 96,
    textAlignVertical: "top",
  },
});
