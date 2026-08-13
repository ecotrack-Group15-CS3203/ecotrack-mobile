import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAsgardeoAuth } from "./useAsgardeoAuth";

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, isReady, isExchanging, error } = useAsgardeoAuth();

  return (
    <View style={styles.container}>
      {isExchanging ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title={t("auth.login")} onPress={signIn} disabled={!isReady} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  error: { color: "#B3261E", paddingHorizontal: 24, textAlign: "center" },
});
