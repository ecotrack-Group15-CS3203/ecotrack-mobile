import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import type { Notification } from "../../types/api";
import { syncCachesForPush } from "./notificationCacheSync";
import { routeFromPushData } from "./pushRouting";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationInbox } from "./useNotifications";

/** A glyph per notification family, so a list of grey text becomes scannable.
 * Unknown types fall back to the bell rather than going blank. */
function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  if (type.startsWith("task_")) return "checkbox-outline";
  if (type.startsWith("event_")) return "calendar-outline";
  if (type.startsWith("join_request_")) return "people-outline";
  if (type.startsWith("incident_")) return "location-outline";
  if (type === "volunteer_removed") return "person-remove-outline";
  return "notifications-outline";
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationInboxScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificationInbox();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  function handlePress(notification: Notification) {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    // Reading an approval here is the last chance to notice a membership
    // change the push listeners missed — opening the inbox from the app
    // never goes through them.
    syncCachesForPush({ type: notification.type });
    routeFromPushData({
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
    });
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
      <View style={[styles.container, styles.errorWrap, { paddingTop: spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
      data={notifications}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        hasUnread ? (
          <Pressable
            onPress={() => markAllReadMutation.mutate()}
            style={styles.markAllRow}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.markAllLabel}>Mark all read</Text>
          </Pressable>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="notifications-outline"
          title="Nothing yet"
          message="Updates about your reports, tasks and organization show up here."
        />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => handlePress(item)}>
          <Card style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
            <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
              <Ionicons
                name={iconFor(item.type)}
                size={18}
                color={item.isRead ? colors.textMuted : colors.primary}
              />
            </View>
            <View style={styles.notificationBody}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.isRead ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Card>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
    paddingBottom: spacing.xl,
    flexGrow: 1,
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
  markAllRow: {
    alignSelf: "flex-end",
    marginBottom: spacing.sm,
  },
  markAllLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  notificationCard: {
    flexDirection: "row",
    gap: spacing.md,
  },
  // Unread is carried by the brand-tinted icon well and the dot rather than a
  // tinted card, which at this density turned the whole list green.
  unreadCard: {
    borderColor: colors.primaryLight,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: {
    backgroundColor: colors.primaryLight,
  },
  notificationBody: {
    flex: 1,
    gap: 3,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationTitle: {
    flex: 1,
    ...typography.h3,
    fontSize: 14.5,
  },
  notificationMessage: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notificationTime: {
    ...typography.meta,
    fontSize: 12,
    marginTop: 2,
  },
});
