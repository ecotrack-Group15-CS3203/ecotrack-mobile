import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { colors, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import type { MyIncident } from "../../types/api";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "./incidentLabels";
import { useMyReports } from "./useMyReports";

function statusFor(report: MyIncident): { label: string; bg: string; fg: string } {
  if (report.verificationStatus === "rejected") {
    return { label: "Rejected", bg: colors.chipBackground, fg: colors.danger };
  }
  if (report.verificationStatus === "duplicate") {
    return { label: "Duplicate", bg: colors.chipBackground, fg: colors.textMuted };
  }
  if (report.organisationId) {
    return { label: "Claimed", bg: colors.primaryLight, fg: colors.primary };
  }
  return { label: "Awaiting claim", bg: colors.chipBackground, fg: colors.chipText };
}

export function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useMyReports();

  const reports = data?.pages.flatMap((page) => page.items) ?? [];

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
      data={reports}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>You haven't reported anything yet.</Text>
        </View>
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
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
                <Badge
                  label={SEVERITY_LABEL[item.severity]}
                  backgroundColor={colors.urgency[item.severity]}
                  textColor="#FFFFFF"
                />
                <Badge label={CATEGORY_LABEL[item.category]} />
                <Badge label={status.label} backgroundColor={status.bg} textColor={status.fg} />
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
  card: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerSpinner: {
    marginVertical: spacing.md,
  },
});
