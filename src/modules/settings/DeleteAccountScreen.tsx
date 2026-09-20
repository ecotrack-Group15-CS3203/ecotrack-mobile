import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { authApi } from "../auth/api/auth.api";
import { useAuthStore } from "../auth/authStore";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      // Deleting the row on the server makes the current access token
      // meaningless (the user it names no longer exists) — sign out locally
      // right away rather than waiting for the next 401 to force it.
      await signOut();
    } catch (err) {
      setError(toApiError(err).message);
      setIsDeleting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.lg }]}
    >
      <Card style={styles.warningCard}>
        <Ionicons name="warning-outline" size={18} color={colors.danger} />
        <Text style={styles.warningText}>
          This permanently deletes your EcoTrack account. Your past reports and completed tasks stay on
          record (SRS §3.11.1), but your profile, saved settings, and any pending assignments or RSVPs
          are removed. This cannot be undone.
        </Text>
      </Card>

      <Text style={styles.note}>
        This only removes your EcoTrack account — you can sign back in with the same login, which will
        create a fresh account.
      </Text>

      <View>
        <Text style={styles.label}>Type {CONFIRM_PHRASE} to confirm</Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          placeholder={CONFIRM_PHRASE}
          placeholderTextColor={colors.textDisabled}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <PrimaryButton
        label="Permanently Delete My Account"
        variant="destructive"
        disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
        loading={isDeleting}
        onPress={handleDelete}
      />
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
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.dangerTint,
    borderColor: colors.danger,
  },
  warningText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.danger,
    lineHeight: 20,
  },
  note: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
