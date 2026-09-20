import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, spacing, typography } from "../../theme/colors";
import { statusTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { taskStatusLabel, taskStatusTone } from "./taskLabels";
import { useMyTasks } from "./useTasks";

const FILTERS = ["All", "Assigned", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

export function MyTasksScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const [filter, setFilter] = useState<Filter>("All");

  const { data, isLoading, isError, error, refetch, isRefetching } = useMyTasks();
  const tasks = data?.items ?? [];

  const visibleTasks = useMemo(() => {
    if (filter === "All") return tasks;
    if (filter === "Assigned") {
      return tasks.filter((task) =>
        task.assignments.some((a) => a.status === "assigned" || a.status === "accepted"),
      );
    }
    if (filter === "In Progress") return tasks.filter((task) => task.status === "in_progress");
    return tasks.filter((task) => task.status === "completed");
  }, [tasks, filter]);

  if (!me?.organisation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon="people-outline"
          title="No organization yet"
          message="Cleanup tasks are assigned by the organization you volunteer with."
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
      data={visibleTasks}
      keyExtractor={(task) => task.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <>
          <ScreenHeader title="My Tasks" subtitle={`Assignments from ${me.organisation.name}`} />
          <View style={styles.filterRow}>
            {FILTERS.map((option) => (
              <Chip key={option} label={option} selected={option === filter} onPress={() => setFilter(option)} />
            ))}
          </View>
        </>
      }
      ListEmptyComponent={
        <EmptyState
          icon="checkbox-outline"
          title="Nothing in this view"
          message={
            filter === "All"
              ? "When your organization assigns you a cleanup, it lands here."
              : "No tasks match this filter right now."
          }
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate("TaskDetail", { taskId: item.id })
          }
        >
          <Card style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Badge label={taskStatusLabel(item)} tone={statusTone(taskStatusTone(item))} />
            </View>
            {item.description ? (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <View style={styles.taskFooter}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.taskDue}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  taskCard: {
    gap: spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    ...typography.h3,
    fontSize: 15,
  },
  taskDescription: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  taskDue: {
    ...typography.meta,
    fontSize: 12,
  },
});
