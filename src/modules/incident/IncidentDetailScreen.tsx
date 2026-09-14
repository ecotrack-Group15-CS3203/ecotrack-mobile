import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { colors, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "./incidentLabels";
import { useIncidentDetail } from "./useIncidents";

type RouteParams = { incidentId: string };

export function IncidentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const { incidentId } = params as RouteParams;

  const { data: incident, isLoading, isError, error } = useIncidentDetail(incidentId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{toApiError(error).message}</Text>
      </View>
    );
  }

  const claimed = incident.visibility === "full" ? incident.organisationId !== null : incident.claimed;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
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
        <Badge
          label={SEVERITY_LABEL[incident.severity]}
          backgroundColor={colors.urgency[incident.severity]}
          textColor="#FFFFFF"
        />
        <Badge label={CATEGORY_LABEL[incident.category]} />
        <Badge
          label={claimed ? "Claimed" : "Awaiting claim"}
          backgroundColor={claimed ? colors.primaryLight : colors.chipBackground}
          textColor={claimed ? colors.primary : colors.chipText}
        />
      </View>

      <Card>
        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <Text style={styles.description}>{incident.description || "No description provided."}</Text>
      </Card>

      {incident.address ? (
        <Card>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <Text style={styles.description}>{incident.address}</Text>
        </Card>
      ) : null}

      {incident.visibility === "public" ? (
        <Text style={styles.publicNote}>
          You're viewing a summary of this report — full details are only visible to the organization
          handling it.
        </Text>
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
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  imageRow: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginRight: spacing.sm,
    backgroundColor: colors.chipBackground,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  publicNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
