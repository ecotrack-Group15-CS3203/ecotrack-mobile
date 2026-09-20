import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { MetaRow } from "../../components/MetaRow";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Segmented } from "../../components/Segmented";
import { colors, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import type { TaskView } from "./api/tasks.api";
import { taskStatusKey, taskStatusTone } from "./taskLabels";
import { useMyTasks } from "./useTasks";

/**
 * The three views that partition a volunteer's work, matching what the API's
 * `?view=` returns (SRS §3.1.8): `assigned` is accepted-or-awaiting and not yet
 * started, `in_progress` and `completed` are accepted tasks at that stage.
 */
const VIEWS: TaskView[] = ["assigned", "in_progress", "completed"];

export function MyTasksScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: me } = useMe();
  const [view, setView] = useState<TaskView>("assigned");

  // The view is passed to the server. This screen used to call useMyTasks() with no
  // view — which the API answers with `assigned` only — and then filtered that list
  // client-side for "In Progress"/"Completed", so those chips were permanently empty.
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyTasks(view);
  const tasks = data?.items ?? [];

  if (!me?.organisation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon="people-outline"
          title={t("tasks.empty.noOrgTitle")}
          message={t("tasks.empty.noOrgBody")}
          action={
            <PrimaryButton
              label={t("tasks.empty.findOrg")}
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

  const now = Date.now();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      data={tasks}
      keyExtractor={(task) => task.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <>
          <ScreenHeader title={t("tasks.title")} subtitle={t("tasks.subtitle", { org: me.organisation.name })} />
          <Segmented
            options={VIEWS.map((value) => ({ value, label: t(`tasks.views.${value}`) }))}
            value={view}
            onChange={setView}
            accessibilityLabel={t("tasks.title")}
            style={styles.segmented}
          />
        </>
      }
      ListEmptyComponent={
        <EmptyState
          icon="checkbox-outline"
          title={t(`tasks.empty.${view}Title`)}
          message={t(`tasks.empty.${view}Body`)}
        />
      }
      renderItem={({ item }) => {
        const overdue = item.status !== "completed" && new Date(item.dueDate).getTime() < now;
        const due = new Date(item.dueDate).toLocaleDateString();
        return (
          <Pressable
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigation as any).navigate("TaskDetail", { taskId: item.id })
            }
            accessibilityRole="button"
          >
            <Card style={styles.taskCard}>
              <View style={styles.badgeRow}>
                <Badge
                  label={t(taskStatusKey(item, me.id))}
                  tone={statusTone(taskStatusTone(item, me.id))}
                />
                <Badge label={t(`tasks.priority.${item.priority}`)} tone={urgencyTone(item.priority)} />
              </View>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <MetaRow
                icon="time-outline"
                text={overdue ? t("tasks.card.overdue", { date: due }) : t("tasks.card.due", { date: due })}
                tone={overdue ? tones.rejected : undefined}
                trailing={<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              />
            </Card>
          </Pressable>
        );
      }}
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
  taskCard: {
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  taskTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  taskDescription: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
