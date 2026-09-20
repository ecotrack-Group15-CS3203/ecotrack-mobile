import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionLabel } from "../../components/SectionLabel";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "../incident/incidentLabels";
import { useCancelRsvp, useEventDetail, useRsvp } from "./useEvents";

type RouteParams = { eventId: string };

function formatRange(scheduledAt: string, endsAt: string): string {
  const start = new Date(scheduledAt);
  const end = new Date(endsAt);
  const dateLabel = start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} · ${startTime} – ${endTime}`;
}

export function EventDetailScreen() {
  const { params } = useRoute();
  const { eventId } = params as RouteParams;

  const { data: me } = useMe();
  const organisationId = me?.organisation?.id;

  const { data: event, isLoading, isError, error } = useEventDetail(organisationId, eventId);
  const rsvpMutation = useRsvp(organisationId, eventId);
  const cancelMutation = useCancelRsvp(organisationId, eventId);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={[styles.container, styles.errorWrap, { paddingTop: spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
      </View>
    );
  }

  const isGoing = event.rsvps.some((r) => r.userId === me?.id);
  const isFull = event.maxAttendees !== null && event.rsvpCount >= event.maxAttendees && !isGoing;
  const canRsvp = event.status === "scheduled" || event.status === "ongoing";

  function handleRsvpToggle() {
    setActionError(null);
    const action = isGoing ? cancelMutation.mutateAsync() : rsvpMutation.mutateAsync();
    action.catch((err) => setActionError(toApiError(err).message));
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
    >
      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.badgeRow}>
        {isGoing ? <Badge label="Going" tone={tones.resolved} /> : null}
        <Badge label={event.status.replace(/_/g, " ")} tone={statusTone(event.status)} />
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.dateRange}>{formatRange(event.scheduledAt, event.endsAt)}</Text>
      </View>

      {event.description ? (
        <Card style={styles.section}>
          <SectionLabel label="Description" />
          <Text style={styles.body}>{event.description}</Text>
        </Card>
      ) : null}

      {event.incidents.length > 0 ? (
        <Card style={styles.section}>
          <SectionLabel label="Linked reports" />
          {event.incidents.map((incident) => (
            <View key={incident.id} style={styles.incidentRow}>
              <Text style={styles.incidentTitle} numberOfLines={1}>
                {incident.title}
              </Text>
              <Badge label={SEVERITY_LABEL[incident.severity]} tone={urgencyTone(incident.severity)} />
              <Badge label={CATEGORY_LABEL[incident.category]} tone={tones.neutral} dot={false} />
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.section}>
        <SectionLabel
          label={`RSVPs (${event.rsvpCount}${event.maxAttendees !== null ? ` / ${event.maxAttendees}` : ""})`}
        />
        {event.rsvps.length === 0 ? (
          <Text style={styles.emptyText}>No one has RSVPed yet — be the first.</Text>
        ) : (
          event.rsvps.map((rsvp) => (
            <View key={rsvp.userId} style={styles.rsvpRow}>
              <View style={styles.rsvpAvatar}>
                <Text style={styles.rsvpInitial}>
                  {(rsvp.user?.fullName ?? "A").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.rsvpName}>{rsvp.user?.fullName ?? "A volunteer"}</Text>
            </View>
          ))
        )}
      </Card>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {canRsvp ? (
        <PrimaryButton
          label={isGoing ? "Cancel RSVP" : isFull ? "Event is full" : "RSVP"}
          variant={isGoing ? "secondary" : "primary"}
          icon={isGoing ? undefined : "checkmark-circle-outline"}
          disabled={isFull && !isGoing}
          loading={rsvpMutation.isPending || cancelMutation.isPending}
          onPress={handleRsvpToggle}
        />
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
  title: typography.h2,
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateRange: {
    ...typography.bodySm,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  body: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  incidentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  incidentTitle: {
    flex: 1,
    ...typography.meta,
    color: colors.textPrimary,
  },
  emptyText: typography.meta,
  rsvpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rsvpAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  rsvpName: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
});
