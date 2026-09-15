import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { colors, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import type { Notification } from "../../types/api";
import { routeFromPushData } from "./pushRouting";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationInbox } from "./useNotifications";

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
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificationInbox();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  function handlePress(notification: Notification) {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    routeFromPushData({
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
    });
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
      data={notifications}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        hasUnread ? (
          <Pressable onPress={() => markAllReadMutation.mutate()} style={styles.markAllRow}>
            <Text style={styles.markAllLabel}>Mark all as read</Text>
          </Pressable>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => handlePress(item)}>
          <Card style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
            <View style={styles.notificationHeader}>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>{timeAgo(item.createdAt)}</Text>
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
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
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
    gap: 4,
  },
  unreadCard: {
    backgroundColor: colors.primaryLight,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
