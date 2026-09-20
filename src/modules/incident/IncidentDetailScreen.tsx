import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { SectionLabel } from "../../components/SectionLabel";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { categoryKey, severityKey } from "./incidentLabels";
import { useIncidentDetail } from "./useIncidents";

type RouteParams = { incidentId: string };

export function IncidentDetailScreen() {
  const { t } = useTranslation();
  const { params } = useRoute();
  const { incidentId } = params as RouteParams;

  const { data: incident, isLoading, isError, error } = useIncidentDetail(incidentId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={[styles.container, styles.errorWrap, { paddingTop: spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
      </View>
    );
  }

  const claimed = incident.visibility === "full" ? incident.organisationId !== null : incident.claimed;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
    >
      {incident.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {incident.images.map((image) => (
            <Image key={image.id} source={{ uri: image.url }} style={styles.image} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.title}>{incident.title}</Text>

      <View style={styles.badgeRow}>
        <Badge label={t(severityKey(incident.severity))} tone={urgencyTone(incident.severity)} />
        <Badge label={t(categoryKey(incident.category))} tone={tones.neutral} dot={false} />
        <Badge
          label={claimed ? "Claimed" : "Awaiting claim"}
          tone={claimed ? statusTone("verified") : tones.pending}
        />
      </View>

      <Card style={styles.section}>
        <SectionLabel label="Description" />
        <Text style={styles.description}>{incident.description || "No description provided."}</Text>
      </Card>

      {incident.address ? (
        <Card style={styles.section}>
          <SectionLabel label="Location" />
          <Text style={styles.description}>{incident.address}</Text>
        </Card>
      ) : null}

      {incident.visibility === "public" ? (
        <View style={styles.publicNote}>
          <Ionicons name="eye-off-outline" size={15} color={colors.textMuted} />
          <Text style={styles.publicNoteText}>
            You're viewing a summary of this report — full details are only visible to the organization
            handling it.
          </Text>
        </View>
      ) : null}
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
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  errorWrap: {
    paddingHorizontal: spacing.lg,
  },
  imageRow: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: 240,
    height: 170,
    borderRadius: radii.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  title: typography.h2,
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  description: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  publicNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  publicNoteText: {
    flex: 1,
    ...typography.meta,
    lineHeight: 18,
  },
});
