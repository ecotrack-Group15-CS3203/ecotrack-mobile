import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../../../theme/colors";
import { Step1Photo } from "./Step1Photo";
import { Step2Location } from "./Step2Location";
import { Step3Details, Urgency } from "./Step3Details";
import { SuccessStep } from "./SuccessStep";

type Step = 1 | 2 | 3 | "success";

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: "Report Incident",
  2: "Confirm Location",
  3: "Details",
};

export function ReportWizardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(1);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("Medium");

  if (step === "success") {
    return <SuccessStep onDone={() => navigation.goBack()} />;
  }

  const goBack = () => {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    setStep((step - 1) as Step);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {STEP_TITLES[step]} · Step {step} of 3
        </Text>
      </View>

      {step === 1 ? (
        <Step1Photo photoTaken={photoTaken} onCapture={() => setPhotoTaken(true)} onNext={() => setStep(2)} />
      ) : null}
      {step === 2 ? <Step2Location onNext={() => setStep(3)} /> : null}
      {step === 3 ? (
        <Step3Details
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          urgency={urgency}
          onUrgencyChange={setUrgency}
          onSubmit={() => setStep("success")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
