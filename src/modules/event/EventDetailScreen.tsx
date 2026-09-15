import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme/colors";
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
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{toApiError(error).message}</Text>
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.badgeRow}>
        {isGoing ? <Badge label="GOING" /> : null}
        <Badge
          label={event.status.toUpperCase()}
          backgroundColor={colors.chipBackground}
          textColor={colors.chipText}
        />
      </View>

      <Text style={styles.dateRange}>{formatRange(event.scheduledAt, event.endsAt)}</Text>

      {event.description ? (
        <Card>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.body}>{event.description}</Text>
        </Card>
      ) : null}

      {event.incidents.length > 0 ? (
        <Card>
          <Text style={styles.sectionLabel}>LINKED REPORTS</Text>
          {event.incidents.map((incident) => (
            <View key={incident.id} style={styles.incidentRow}>
              <Text style={styles.incidentTitle} numberOfLines={1}>
                {incident.title}
              </Text>
              <Badge
                label={SEVERITY_LABEL[incident.severity]}
                backgroundColor={colors.urgency[incident.severity]}
                textColor="#FFFFFF"
              />
              <Badge label={CATEGORY_LABEL[incident.category]} />
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionLabel}>
          RSVPS ({event.rsvpCount}
          {event.maxAttendees !== null ? ` / ${event.maxAttendees}` : ""})
        </Text>
        {event.rsvps.length === 0 ? (
          <Text style={styles.emptyText}>No one has RSVPed yet — be the first.</Text>
        ) : (
          event.rsvps.map((rsvp) => (
            <Text key={rsvp.userId} style={styles.rsvpName}>
              {rsvp.user?.fullName ?? "A volunteer"}
            </Text>
          ))
        )}
      </Card>

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      {canRsvp ? (
        <PrimaryButton
          label={isGoing ? "Cancel RSVP" : isFull ? "Event is full" : "RSVP"}
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
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateRange: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  incidentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  incidentTitle: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  rsvpName: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
});
