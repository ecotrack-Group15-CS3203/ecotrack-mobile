import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../../theme/colors";

type Props = {
  label: string;
};

export function PlaceholderScreen({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  text: typography.h3,
});
