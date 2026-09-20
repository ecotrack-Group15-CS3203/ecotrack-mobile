import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { colors, radii, spacing, typography } from "../../theme/colors";
import { tones } from "../../theme/tones";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition } from "../map/locationService";
import { useOrganisationDirectory } from "./useOrganisations";

export function OrganisationDirectoryScreen() {
  const navigation = useNavigation();

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [coordinate, setCoordinate] = useState<{ lat: number; lng: number } | null>(null);

  // Debounced so every keystroke doesn't fire a new search request.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(rawQuery), 400);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Best-effort: a directory search still works by name alone if this is
  // denied or unavailable, just without the "serves your area" badge.
  useEffect(() => {
    let active = true;
    (async () => {
      const granted = await ensureForegroundPermission();
      if (!active || !granted) return;
      const fix = await getCurrentPosition();
      if (active && fix) {
        setCoordinate({ lat: fix.coordinate.latitude, lng: fix.coordinate.longitude });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const { data, isLoading, isError, error } = useOrganisationDirectory(query, coordinate);
  const organisations = data?.items ?? [];

  return (
    <View style={[styles.container, { paddingTop: spacing.md }]}>
      <Text style={styles.intro}>Volunteer with a group working near you.</Text>
      <View style={styles.searchField}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor={colors.textDisabled}
          value={rawQuery}
          onChangeText={setRawQuery}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      ) : isError ? (
        <View style={styles.spinner}>
          <ErrorBanner message={toApiError(error).message} />
        </View>
      ) : (
        <FlatList
          data={organisations}
          keyExtractor={(org) => org.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No organizations found"
              message={
                query
                  ? `Nothing matches "${query}". Try a shorter search.`
                  : "No organizations are listed yet."
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate("JoinRequest", {
                  organisationId: item.id,
                  organisationName: item.name,
                })
              }
            >
              <Card style={styles.orgCard}>
                <View style={styles.orgHeader}>
                  <Text style={styles.orgName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.eligible !== null ? (
                    <Badge
                      label={item.eligible ? "Serves your area" : "Outside your area"}
                      tone={item.eligible ? tones.resolved : tones.neutral}
                    />
                  ) : null}
                </View>
                {item.description ? (
                  <Text style={styles.orgDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.distanceMeters !== null ? (
                  <View style={styles.orgFooter}>
                    <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.orgDistance}>{(item.distanceMeters / 1000).toFixed(1)} km away</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    ...typography.bodySm,
    marginBottom: spacing.md,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  orgCard: {
    gap: spacing.sm,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orgName: {
    flex: 1,
    ...typography.h3,
    fontSize: 15,
  },
  orgDescription: {
    ...typography.meta,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  orgFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  orgDistance: {
    ...typography.meta,
    fontSize: 12,
  },
});
