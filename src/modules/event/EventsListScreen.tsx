import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { colors, radii, spacing } from "../../theme/colors";

type MockEvent = {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  rsvpCount: number;
  going: boolean;
};

const MOCK_EVENTS: MockEvent[] = [
  {
    id: "1",
    title: "Saturday Canal Cleanup",
    dateLabel: "Sat, Aug 9 · 8:00 AM",
    location: "Kelani Canal, Access Point 3",
    rsvpCount: 14,
    going: false,
  },
  {
    id: "2",
    title: "Lakeside Restoration Day",
    dateLabel: "Sat, Aug 16 · 7:30 AM",
    location: "Beira Lake North Bank",
    rsvpCount: 22,
    going: true,
  },
];

export function EventsListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      data={MOCK_EVENTS}
      keyExtractor={(event) => event.id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>My Events</Text>
          <Text style={styles.subtitle}>Upcoming cleanups near you</Text>
        </>
      }
      renderItem={({ item }) => (
        <Card style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar-outline" size={20} color="#4C5FD5" />
          </View>
          <View style={styles.eventBody}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.going ? <Badge label="GOING" /> : null}
            </View>
            <Text style={styles.eventMeta}>{item.dateLabel}</Text>
            <Text style={styles.eventMeta}>{item.location}</Text>
            <Text style={styles.eventRsvps}>{item.rsvpCount} RSVPs</Text>
          </View>
        </Card>
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
