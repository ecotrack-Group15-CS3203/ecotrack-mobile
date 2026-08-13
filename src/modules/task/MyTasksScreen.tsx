import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { colors, spacing } from "../../theme/colors";

type TaskStatus = "assigned" | "completed";

type MockTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueLabel: string;
};

const MOCK_TASKS: MockTask[] = [
  {
    id: "1",
    title: "Clear debris — canal bank",
    description: "Illegal dumping near canal bank",
    status: "assigned",
    dueLabel: "Due Aug 9",
  },
  {
    id: "2",
    title: "Bag collected oil-soaked waste",
    description: "Oil sheen spreading on lake surface",
    status: "completed",
    dueLabel: "Due Aug 6",
  },
];

const FILTERS = ["All", "Assigned", "Completed"] as const;

export function MyTasksScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const tasks = MOCK_TASKS.filter((task) => filter === "All" || task.status === filter.toLowerCase());

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      data={tasks}
      keyExtractor={(task) => task.id}
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
      renderItem={({ item }) => (
        <Card style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskStatus}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.taskDescription}>{item.description}</Text>
          <Text style={styles.taskDue}>{item.dueLabel}</Text>
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
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: "row",
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
