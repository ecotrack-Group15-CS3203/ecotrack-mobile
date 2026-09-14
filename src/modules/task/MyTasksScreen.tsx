import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { taskStatusLabel } from "./taskLabels";
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
      <View style={[styles.centered, { paddingTop: insets.top, gap: spacing.md }]}>
        <Text style={styles.emptyText}>Join an organization to be assigned cleanup tasks.</Text>
        <PrimaryButton
          label="Find an Organization"
          onPress={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate("OrganisationDirectory")
          }
        />
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
      data={visibleTasks}
      keyExtractor={(task) => task.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>Assignments from your organization</Text>
          <View style={styles.filterRow}>
            {FILTERS.map((option) => (
              <Chip key={option} label={option} selected={option === filter} onPress={() => setFilter(option)} />
            ))}
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tasks here.</Text>
        </View>
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
              <Text style={styles.taskStatus}>{taskStatusLabel(item)}</Text>
            </View>
            {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
            <Text style={styles.taskDue}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>
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
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  taskCard: {
    gap: 4,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  taskStatus: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  taskDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  taskDue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
