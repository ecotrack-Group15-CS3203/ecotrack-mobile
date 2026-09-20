import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Ionicons } from "@expo/vector-icons";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionLabel } from "../../components/SectionLabel";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { statusTone, urgencyTone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { taskStatusKey, taskStatusTone } from "./taskLabels";
import {
  useAddTaskNote,
  useCompleteTask,
  useRespondToAssignment,
  useStartTask,
  useTaskDetail,
} from "./useTasks";

type RouteParams = { taskId: string };

export function TaskDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { params } = useRoute();
  const { taskId } = params as RouteParams;

  const { data: me } = useMe();
  const organisationId = me?.organisation?.id;

  const { data: task, isLoading, isError, error } = useTaskDetail(organisationId, taskId);
  const respondMutation = useRespondToAssignment(organisationId, taskId);
  const startMutation = useStartTask(organisationId, taskId);
  const completeMutation = useCompleteTask(organisationId, taskId);
  const addNoteMutation = useAddTaskNote(organisationId, taskId);

  const [noteText, setNoteText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  function runAction(action: Promise<unknown>) {
    setActionError(null);
    action.catch((err) => setActionError(toApiError(err).message));
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !task) {
    return (
      <View style={[styles.container, styles.errorWrap, { paddingTop: spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
      </View>
    );
  }

  const myAssignment = task.assignments.find((a) => a.volunteerUserId === me?.id);
  const awaitingResponse = myAssignment?.status === "assigned";
  const accepted = myAssignment?.status === "accepted";
  const canStart = accepted && task.status === "pending";
  const canWorkOn = task.status === "in_progress";
  const canComplete = canWorkOn && task.photos.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
    >
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.badgeRow}>
        <Badge label={t(taskStatusKey(task, me?.id))} tone={statusTone(taskStatusTone(task, me?.id))} />
        <Badge label={`${task.priority} priority`} tone={urgencyTone(task.priority)} />
      </View>
      <View style={styles.dueRow}>
        <Ionicons name="time-outline" size={15} color={colors.textMuted} />
        <Text style={styles.dueDate}>Due {new Date(task.dueDate).toLocaleDateString()}</Text>
      </View>

      {task.description ? (
        <Card style={styles.section}>
          <SectionLabel label="Description" />
          <Text style={styles.body}>{task.description}</Text>
        </Card>
      ) : null}

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {awaitingResponse ? (
        <View style={styles.actionRow}>
          <View style={styles.actionButtonFlex}>
            <PrimaryButton
              label="Accept"
              loading={respondMutation.isPending}
              onPress={() => runAction(respondMutation.mutateAsync({ accept: true }))}
            />
          </View>
          <PrimaryButton
            label="Decline"
            variant="secondary"
            onPress={() => runAction(respondMutation.mutateAsync({ accept: false, reason: "Not available" }))}
          />
        </View>
      ) : null}

      {canStart ? (
        <PrimaryButton
          label="Start Task"
          icon="play-outline"
          loading={startMutation.isPending}
          onPress={() => runAction(startMutation.mutateAsync())}
        />
      ) : null}

      {canWorkOn ? (
        <>
          <Card style={styles.section}>
            <SectionLabel label="Notes" />
            {task.notes.length === 0 ? (
              <Text style={styles.emptyText}>No notes yet.</Text>
            ) : (
              task.notes.map((note) => (
                <Text key={note.id} style={styles.note}>
                  • {note.note}
                </Text>
              ))
            )}
            <View style={styles.noteInputRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note"
                placeholderTextColor={colors.textDisabled}
                value={noteText}
                onChangeText={setNoteText}
              />
              <Pressable
                style={styles.noteAddButton}
                disabled={!noteText.trim() || addNoteMutation.isPending}
                onPress={() => {
                  runAction(addNoteMutation.mutateAsync(noteText.trim()));
                  setNoteText("");
                }}
              >
                <Text style={styles.noteAddLabel}>Add</Text>
              </Pressable>
            </View>
          </Card>

          <Card style={styles.section}>
            <SectionLabel label="Evidence photos" />
            {task.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {task.photos.map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.url }} style={styles.evidenceImage} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No photos added yet — at least one is required to complete.</Text>
            )}
            <PrimaryButton
              label="Add Evidence Photo"
              variant="secondary"
              size="sm"
              icon="camera-outline"
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate("TaskEvidence", { taskId, organisationId })
              }
            />
          </Card>

          <PrimaryButton
            label="Complete Task"
            icon="checkmark-circle-outline"
            disabled={!canComplete}
            loading={completeMutation.isPending}
            onPress={() => runAction(completeMutation.mutateAsync())}
          />
        </>
      ) : null}
    </ScrollView>
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
    gap: spacing.md,
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
  title: typography.h2,
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dueDate: typography.meta,
  section: {
    gap: spacing.sm,
  },
  body: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButtonFlex: {
    flex: 1,
  },
  emptyText: typography.meta,
  note: {
    ...typography.meta,
    color: colors.textPrimary,
  },
  noteInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  noteAddButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  noteAddLabel: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  evidenceImage: {
    width: 120,
    height: 90,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
});
