import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition, LOCATION_RATIONALE } from "../map/locationService";
import { useSubmitJoinRequest } from "./useOrganisations";

type RouteParams = { organisationId: string; organisationName: string };

export function JoinRequestScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.title}>Join {organisationName}</Text>
      <Card>
        <Text style={styles.consentText}>{LOCATION_RATIONALE.joinOrganization}</Text>
      </Card>

      <View>
        <Text style={styles.label}>MESSAGE (OPTIONAL)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Tell the organization why you'd like to join"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
      </View>

      {(locationError || mutationError) && (
        <Text style={styles.errorText}>{locationError ?? mutationError?.message}</Text>
      )}

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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  consentText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    backgroundColor: colors.surface,
    minHeight: 90,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
});
