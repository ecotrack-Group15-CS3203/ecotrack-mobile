import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { colors, radii, spacing } from "../../theme/colors";
import { toApiError } from "../../services/apiError";
import { ensureForegroundPermission, getCurrentPosition } from "../map/locationService";
import { useOrganisationDirectory } from "./useOrganisations";

export function OrganisationDirectoryScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Find an Organization</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name"
        value={rawQuery}
        onChangeText={setRawQuery}
        autoCapitalize="none"
      />

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : isError ? (
        <Text style={styles.errorText}>{toApiError(error).message}</Text>
      ) : (
        <FlatList
          data={organisations}
          keyExtractor={(org) => org.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No organizations found.</Text>}
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
                      backgroundColor={item.eligible ? colors.primaryLight : colors.chipBackground}
                      textColor={item.eligible ? colors.primary : colors.textMuted}
                    />
                  ) : null}
                </View>
                {item.description ? (
                  <Text style={styles.orgDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.distanceMeters !== null ? (
                  <Text style={styles.orgDistance}>{(item.distanceMeters / 1000).toFixed(1)} km away</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  searchInput: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  orgCard: {
    gap: spacing.xs,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orgName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  orgDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  orgDistance: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
