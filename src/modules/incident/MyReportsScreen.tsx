import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
import { SectionLabel } from "../../components/SectionLabel";
import { ThumbPlaceholder } from "../../components/ThumbPlaceholder";
import { colors, spacing, typography } from "../../theme/colors";
import { statusTone, tones, urgencyTone, type Tone } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import type { MyIncident } from "../../types/api";
import { categoryKey, CATEGORY_ICON, severityKey } from "./incidentLabels";
import { QueueBanner } from "./QueueBanner";
import { useMyReports } from "./useMyReports";

function statusFor(report: MyIncident): { key: string; tone: Tone } {
  if (report.verificationStatus === "rejected") {
    return { key: "incident.status.rejected", tone: statusTone("rejected") };
  }
  if (report.verificationStatus === "duplicate") {
    return { key: "incident.status.duplicate", tone: statusTone("duplicate") };
  }
  if (report.organisationId) {
    return { key: "incident.status.claimed", tone: statusTone("verified") };
  }
  return { key: "incident.status.awaitingClaim", tone: tones.pending };
}

/**
 * The Report tab. It used to be a placeholder that intercepted its own tab press to
 * open the same wizard the map's floating button opens — two controls, one action.
 * SRS §3.9.1 requires both a Report tab and a Report FAB on the map, so neither can
 * go; instead the tab is where you *track* reports and the FAB is where you make
 * one from the map.
 */
export function MyReportsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useMyReports();

  const reports = data?.pages.flatMap((page) => page.items) ?? [];
  // The server's own count, not reports.length — the list is paginated.
  const total = data?.pages[0]?.total ?? 0;

  function openWizard() {
    navigation.getParent()?.navigate("ReportModal" as never);
  }

  const cta = (
    <PrimaryButton label={t("reports.cta")} icon="add-circle-outline" size="lg" onPress={openWizard} />
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.errorWrap, { paddingTop: insets.top + spacing.xl }]}>
        <ErrorBanner message={toApiError(error).message} />
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
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenHeader title={t("reports.title")} subtitle={t("reports.subtitle")} style={styles.screenHeader} />
          {cta}
          <QueueBanner />
          {reports.length > 0 ? (
            <SectionLabel
              label={t("reports.recent")}
              trailing={<Text style={styles.count}>{total}</Text>}
              style={styles.sectionLabel}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="document-text-outline" title={t("reports.emptyTitle")} message={t("reports.emptyMessage")} />
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
            accessibilityRole="button"
          >
            <Card style={styles.card}>
              <ThumbPlaceholder
                seed={item.id}
                uri={item.images[0]?.url}
                width={64}
                height={64}
                icon={CATEGORY_ICON[item.category]}
              />
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <MetaRow
                  icon="calendar-outline"
                  text={`${t(categoryKey(item.category))} · ${new Date(item.createdAt).toLocaleDateString()}`}
                />
                <View style={styles.badgeRow}>
                  <Badge label={t(status.key)} tone={status.tone} />
                  <Badge label={t(severityKey(item.severity))} tone={urgencyTone(item.severity)} />
                </View>
              </View>
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
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  screenHeader: {
    marginBottom: 0,
  },
  sectionLabel: {
    marginTop: spacing.sm,
  },
  count: {
    ...typography.label,
    color: colors.textSecondary,
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  body: {
    flex: 1,
    gap: 6,
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
  footerSpinner: {
    marginVertical: spacing.md,
  },
});
