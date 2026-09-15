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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { useMe } from "../auth/useMe";
import { taskStatusLabel } from "./taskLabels";
import {
  useAddTaskNote,
  useCompleteTask,
  useRespondToAssignment,
  useStartTask,
  useTaskDetail,
} from "./useTasks";

type RouteParams = { taskId: string };

export function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !task) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{toApiError(error).message}</Text>
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.badgeRow}>
        <Badge label={taskStatusLabel(task)} />
        <Badge
          label={task.priority.toUpperCase()}
          backgroundColor={colors.urgency[task.priority]}
          textColor="#FFFFFF"
        />
      </View>
      <Text style={styles.dueDate}>Due {new Date(task.dueDate).toLocaleDateString()}</Text>

      {task.description ? (
        <Card>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.body}>{task.description}</Text>
        </Card>
      ) : null}

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      {awaitingResponse ? (
        <View style={styles.actionRow}>
          <View style={styles.actionButtonFlex}>
            <PrimaryButton
              label="Accept"
              loading={respondMutation.isPending}
              onPress={() => runAction(respondMutation.mutateAsync({ accept: true }))}
            />
          </View>
          <Pressable
            style={styles.declineButton}
            onPress={() => runAction(respondMutation.mutateAsync({ accept: false, reason: "Not available" }))}
          >
            <Text style={styles.declineLabel}>Decline</Text>
          </Pressable>
        </View>
      ) : null}

      {canStart ? (
        <PrimaryButton
          label="Start Task"
          loading={startMutation.isPending}
          onPress={() => runAction(startMutation.mutateAsync())}
        />
      ) : null}

      {canWorkOn ? (
        <>
          <Card>
            <Text style={styles.sectionLabel}>NOTES</Text>
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

          <Card>
            <Text style={styles.sectionLabel}>EVIDENCE PHOTOS</Text>
            {task.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {task.photos.map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.url }} style={styles.evidenceImage} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No photos added yet — at least one is required to complete.</Text>
            )}
            <Pressable
              style={styles.addEvidenceButton}
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate("TaskEvidence", { taskId, organisationId })
              }
            >
              <Text style={styles.addEvidenceLabel}>Add Evidence Photo</Text>
            </Pressable>
          </Card>

          <PrimaryButton
            label="Complete Task"
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
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dueDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 14,
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
  declineButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  declineLabel: {
    color: colors.danger,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  note: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noteInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
  },
  noteAddButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  noteAddLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  evidenceImage: {
    width: 120,
    height: 90,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.chipBackground,
  },
  addEvidenceButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  addEvidenceLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
