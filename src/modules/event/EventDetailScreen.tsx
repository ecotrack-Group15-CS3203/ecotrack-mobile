import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarStack } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { DateTile } from "../../components/DateTile";
import { ErrorBanner } from "../../components/ErrorBanner";
import { MetaList, MetaRow } from "../../components/MetaRow";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionLabel } from "../../components/SectionLabel";
import { ThumbPlaceholder } from "../../components/ThumbPlaceholder";
import { colors, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { categoryKey, severityKey } from "../incident/incidentLabels";
import { canRsvp as isOpenForRsvp, formatLongDate, formatTimeRange } from "./eventFormat";
import { useCancelRsvp, useEventDetail, useRsvp } from "./useEvents";

type RouteParams = { eventId: string };

export function EventDetailScreen() {
  const { t } = useTranslation();
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

  // Detail rows have no `rsvpedByMe` (only list rows do), so it is derived here.
  const isGoing = event.rsvps.some((r) => r.userId === me?.id);
  const isFull = event.maxAttendees !== null && event.rsvpCount >= event.maxAttendees && !isGoing;
  const open = isOpenForRsvp(event.status);
  // Names only. The API also returns each attendee's email address; showing peers'
  // contact details would breach purpose limitation (SRS §3.11.2, §3.1.19).
  const attendeeNames = event.rsvps.map((rsvp) => rsvp.user?.fullName ?? null);

  function handleRsvpToggle() {
    setActionError(null);
    const action = isGoing ? cancelMutation.mutateAsync() : rsvpMutation.mutateAsync();
    action.catch((err) => setActionError(toApiError(err).message));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThumbPlaceholder seed={event.id} height={150} radius={0} icon="leaf-outline">
        <View style={styles.dateTile}>
          <DateTile date={event.scheduledAt} />
        </View>
        <View style={styles.badges}>
          {isGoing ? <Badge label={t("events.goingBadge")} tone={tones.resolved} /> : null}
          {event.status !== "scheduled" ? (
            <Badge label={t(`events.status.${event.status}`)} tone={statusTone(event.status)} />
          ) : null}
        </View>
      </ThumbPlaceholder>

      <View style={styles.padded}>
        <View style={styles.headline}>
          <Text style={styles.title}>{event.title}</Text>
          {me?.organisation ? (
            <MetaRow icon="business-outline" text={t("events.hostedBy", { org: me.organisation.name })} />
          ) : null}
        </View>

        <Card>
          <MetaList>
            <MetaRow icon="calendar-outline" text={formatLongDate(event.scheduledAt)} />
            <MetaRow icon="time-outline" text={formatTimeRange(event.scheduledAt, event.endsAt)} />
            <MetaRow
              icon="people-outline"
              text={
                event.maxAttendees !== null
                  ? t("events.goingOf", { count: event.rsvpCount, max: event.maxAttendees })
                  : t("events.going", { count: event.rsvpCount })
              }
            />
          </MetaList>
        </Card>

        {event.description ? (
          <Card style={styles.section}>
            <SectionLabel label={t("events.detail.description")} />
            <Text style={styles.body}>{event.description}</Text>
          </Card>
        ) : null}

        {event.incidents.length > 0 ? (
          <Card style={styles.section}>
            <SectionLabel label={t("events.detail.linkedReports")} />
            {event.incidents.map((incident) => (
              <View key={incident.id} style={styles.incidentRow}>
                <Text style={styles.incidentTitle} numberOfLines={1}>
                  {incident.title}
                </Text>
                <Badge label={t(severityKey(incident.severity))} tone={urgencyTone(incident.severity)} />
                <Badge label={t(categoryKey(incident.category))} tone={tones.neutral} dot={false} />
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={styles.section}>
          <SectionLabel
            label={t("events.detail.attendees")}
            trailing={attendeeNames.length > 0 ? <AvatarStack names={attendeeNames} /> : null}
          />
          {event.rsvps.length === 0 ? (
            <Text style={styles.emptyText}>{t("events.detail.noAttendees")}</Text>
          ) : (
            event.rsvps.map((rsvp) => (
              <View key={rsvp.userId} style={styles.rsvpRow}>
                <Avatar name={rsvp.user?.fullName} size={28} />
                <Text style={styles.rsvpName}>{rsvp.user?.fullName ?? "—"}</Text>
              </View>
            ))
          )}
        </Card>

        {actionError ? <ErrorBanner message={actionError} /> : null}

        {open ? (
          <PrimaryButton
            label={isGoing ? t("events.cancelRsvp") : isFull ? t("events.full") : t("events.rsvp")}
            variant={isGoing ? "secondary" : "primary"}
            icon={isGoing ? undefined : "checkmark-circle-outline"}
            disabled={isFull && !isGoing}
            loading={rsvpMutation.isPending || cancelMutation.isPending}
            onPress={handleRsvpToggle}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  dateTile: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.md,
  },
  badges: {
    position: "absolute",
    right: spacing.lg,
    top: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  headline: {
    gap: spacing.xs,
  },
  title: typography.h2,
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
  rsvpName: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
});
