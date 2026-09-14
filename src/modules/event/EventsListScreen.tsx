import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { colors, radii, spacing } from "../../theme/colors";
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
        <Text style={styles.emptyText}>Join an organization to see its upcoming events.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{toApiError(error).message}</Text>
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
      ListHeaderComponent={
        <>
          <Text style={styles.title}>My Events</Text>
          <Text style={styles.subtitle}>Upcoming cleanups near you</Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No events scheduled yet.</Text>
        </View>
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
              <Ionicons name="calendar-outline" size={20} color="#4C5FD5" />
            </View>
            <View style={styles.eventBody}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.rsvpedByMe ? <Badge label="GOING" /> : null}
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
              <Text style={styles.eventRsvps}>{item.rsvpCount} RSVPs</Text>
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
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    marginBottom: spacing.lg,
    fontSize: 13,
    color: colors.textSecondary,
  },
  eventCard: {
    flexDirection: "row",
    gap: spacing.md,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: "#E4E4FA",
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
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  eventMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  eventRsvps: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
});
