import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { tones } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { useEvents } from "./useEvents";

export function EventsListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const { data, isLoading, isError, error, refetch, isRefetching } = useEvents();
  const events = data?.items ?? [];

  if (!me?.organisation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon="calendar-outline"
          title="No organization yet"
          message="Cleanup events are run by organizations. Join one to see what's coming up."
          action={
            <PrimaryButton
              label="Find an Organization"
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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, styles.errorWrap, { paddingTop: insets.top + spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      data={events}
      keyExtractor={(event) => event.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={<ScreenHeader title="My Events" subtitle="Upcoming cleanups near you" />}
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title="Nothing scheduled"
          message={`${me.organisation.name} hasn't scheduled an event yet. You'll be notified when one is.`}
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate("EventDetail", { eventId: item.id })
          }
        >
          <Card style={styles.eventCard}>
            <View style={styles.eventIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.status.progress} />
            </View>
            <View style={styles.eventBody}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.rsvpedByMe ? <Badge label="Going" tone={tones.resolved} /> : null}
              </View>
              <Text style={styles.eventMeta}>
                {new Date(item.scheduledAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <View style={styles.eventFooter}>
                <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                <Text style={styles.eventRsvps}>{item.rsvpCount} going</Text>
              </View>
            </View>
          </Card>
        </Pressable>
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
  eventCard: {
    flexDirection: "row",
    gap: spacing.md,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.status.progressTint,
    alignItems: "center",
    justifyContent: "center",
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  eventTitle: {
    flex: 1,
    ...typography.h3,
    fontSize: 15,
  },
  eventMeta: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  eventRsvps: {
    ...typography.meta,
    fontSize: 12,
  },
});
