import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { authApi } from "../auth/api/auth.api";
import { useAuthStore } from "../auth/authStore";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Delete Account</Text>

      <Card style={styles.warningCard}>
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
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton
        label="Permanently Delete My Account"
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  warningCard: {
    backgroundColor: "#FDECEA",
  },
  warningText: {
    fontSize: 14,
    color: colors.danger,
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
});
