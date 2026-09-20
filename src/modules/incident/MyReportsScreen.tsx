import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { colors, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone, type Tone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import type { MyIncident } from "../../types/api";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "./incidentLabels";
import { useMyReports } from "./useMyReports";

function statusFor(report: MyIncident): { label: string; tone: Tone } {
  if (report.verificationStatus === "rejected") {
    return { label: "Rejected", tone: statusTone("rejected") };
  }
  if (report.verificationStatus === "duplicate") {
    return { label: "Duplicate", tone: statusTone("duplicate") };
  }
  if (report.organisationId) {
    return { label: "Claimed", tone: statusTone("verified") };
  }
  return { label: "Awaiting claim", tone: tones.pending };
}

export function MyReportsScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useMyReports();

  const reports = data?.pages.flatMap((page) => page.items) ?? [];

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
      data={reports}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListHeaderComponent={
        reports.length > 0 ? (
          <Text style={styles.listIntro}>Everything you've reported, and where it got to.</Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="No reports yet"
          message="Anything you report from the map shows up here, with its review status."
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} color={colors.primary} /> : null
      }
      renderItem={({ item }) => {
        const status = statusFor(item);
        return (
          <Pressable
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigation as any).navigate("IncidentDetail", { incidentId: item.id })
            }
          >
            <Card style={styles.card}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.badgeRow}>
                <Badge label={SEVERITY_LABEL[item.severity]} tone={urgencyTone(item.severity)} />
                <Badge label={CATEGORY_LABEL[item.category]} tone={tones.neutral} dot={false} />
                <Badge label={status.label} tone={status.tone} />
              </View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </Card>
          </Pressable>
        );
      }}
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
    gap: spacing.md,
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
  listIntro: {
    ...typography.bodySm,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 15,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  date: {
    ...typography.meta,
    fontSize: 12,
  },
  footerSpinner: {
    marginVertical: spacing.md,
  },
});
