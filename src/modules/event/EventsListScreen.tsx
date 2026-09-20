import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { DateTile } from "../../components/DateTile";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { MetaList, MetaRow } from "../../components/MetaRow";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Segmented } from "../../components/Segmented";
import { ThumbPlaceholder } from "../../components/ThumbPlaceholder";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { statusTone, tones } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import type { EventListItem } from "../../types/api";
import { useMe } from "../auth/useMe";
import { canRsvp, formatShortDate, formatTimeRange } from "./eventFormat";
import { useEvents, useRsvp } from "./useEvents";

type View_ = "upcoming" | "past";
const VIEWS: View_[] = ["upcoming", "past"];

type CardProps = {
  event: EventListItem;
  organisationId: string;
  onOpen: () => void;
};

/** A component rather than inline in renderItem so each card owns its own RSVP
 * mutation — one card's in-flight request must not disable the others. */
function EventCard({ event, organisationId, onOpen }: CardProps) {
  const { t } = useTranslation();
  const rsvp = useRsvp(organisationId, event.id);

  const going = event.rsvpedByMe;
  const full = event.maxAttendees !== null && event.rsvpCount >= event.maxAttendees && !going;
  const showStatus = event.status !== "scheduled";
  const errorMessage = rsvp.isError ? toApiError(rsvp.error).message : null;

  return (
    <Pressable onPress={onOpen} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.clip}>
          <ThumbPlaceholder seed={event.id} height={104} radius={0} icon="leaf-outline">
            <View style={styles.dateTile}>
              <DateTile date={event.scheduledAt} />
            </View>
            {showStatus ? (
              <View style={styles.statusBadge}>
                <Badge label={t(`events.status.${event.status}`)} tone={statusTone(event.status)} />
              </View>
            ) : null}
          </ThumbPlaceholder>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>

            <MetaList>
              <MetaRow icon="calendar-outline" text={formatShortDate(event.scheduledAt)} />
              <MetaRow icon="time-outline" text={formatTimeRange(event.scheduledAt, event.endsAt)} />
              <MetaRow
                icon="people-outline"
                // Capacity only when there is one — `maxAttendees: null` means uncapped,
                // and "23 of null going" is not a thing.
                text={
                  event.maxAttendees !== null
                    ? t("events.goingOf", { count: event.rsvpCount, max: event.maxAttendees })
                    : t("events.going", { count: event.rsvpCount })
                }
              />
            </MetaList>

            {canRsvp(event.status) ? (
              <View style={styles.footer}>
                {going ? (
                  <Badge label={t("events.goingBadge")} tone={tones.resolved} />
                ) : (
                  <PrimaryButton
                    label={full ? t("events.full") : t("events.rsvp")}
                    icon={full ? undefined : "checkmark-circle-outline"}
                    size="sm"
                    disabled={full}
                    loading={rsvp.isPending}
                    onPress={() => rsvp.mutate()}
                  />
                )}
              </View>
            ) : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function EventsListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const [view, setView] = useState<View_>("upcoming");

  // "Upcoming" is two server statuses (an admin can flip an event to `ongoing`), and
  // "Past" is one. Each is fetched only while its segment is showing. Before this the
  // list took whatever the API returned unfiltered — ascending by date, so finished
  // events led the list and pushed the upcoming ones down (or off the first page).
  const scheduled = useEvents("scheduled", view === "upcoming");
  const ongoing = useEvents("ongoing", view === "upcoming");
  const completed = useEvents("completed", view === "past");

  const primary = view === "upcoming" ? scheduled : completed;
  const events =
    view === "upcoming"
      ? [...(ongoing.data?.items ?? []), ...(scheduled.data?.items ?? [])]
      : (completed.data?.items ?? []);

  if (!me?.organisation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon="calendar-outline"
          title={t("events.empty.noOrgTitle")}
          message={t("events.empty.noOrgBody")}
          action={
            <PrimaryButton
              label={t("events.empty.findOrg")}
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate("OrganisationDirectory")
              }
            />
          }
        />
      </View>
    );
  }

  if (primary.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (primary.isError) {
    return (
      <View style={[styles.centered, styles.errorWrap, { paddingTop: insets.top + spacing.xl }]}>
        <ErrorBanner message={toApiError(primary.error).message} />
      </View>
    );
  }

  const organisationId = me.organisation.id;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      data={events}
      keyExtractor={(event) => event.id}
      refreshing={primary.isRefetching}
      onRefresh={() => {
        void primary.refetch();
        if (view === "upcoming") void ongoing.refetch();
      }}
      ListHeaderComponent={
        <>
          <ScreenHeader title={t("events.title")} subtitle={t("events.subtitle")} />
          <Segmented
            options={VIEWS.map((value) => ({ value, label: t(`events.views.${value}`) }))}
            value={view}
            onChange={setView}
            accessibilityLabel={t("events.title")}
            style={styles.segmented}
          />
        </>
      }
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title={t(`events.empty.${view}Title`)}
          message={t(`events.empty.${view}Body`, { org: me.organisation.name })}
        />
      }
      renderItem={({ item }) => (
        <EventCard
          event={item}
          organisationId={organisationId}
          onOpen={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate("EventDetail", { eventId: item.id })
          }
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  errorWrap: {
    justifyContent: "flex-start",
  },
  segmented: {
    marginBottom: spacing.lg,
  },
  // Padding lives on the inner content so the header band can run edge to edge.
  card: {
    padding: 0,
  },
  // The Card keeps its shadow; this inner wrapper does the corner clipping.
  clip: {
    borderRadius: radii.md - 1,
    overflow: "hidden",
  },
  dateTile: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
  },
  statusBadge: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 17,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.meta,
    color: colors.danger,
    textAlign: "right",
  },
});
