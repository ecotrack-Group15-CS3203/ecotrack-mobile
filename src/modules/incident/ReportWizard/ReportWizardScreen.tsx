import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing, typography } from "../../../theme/colors";
import { useIncidentStore } from "../incidentStore";
import { Step1Photo } from "./Step1Photo";
import { Coordinate, Step2Location } from "./Step2Location";
import { Step3Details, Urgency } from "./Step3Details";
import { SuccessStep } from "./SuccessStep";

type Step = 1 | 2 | 3 | "success";

const STEP_TITLE_KEYS = {
  1: "report.wizard.title.photo",
  2: "report.wizard.title.location",
  3: "report.wizard.title.details",
} as const;

export function ReportWizardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const submitIncident = useIncidentStore((state) => state.submitIncident);

  const [step, setStep] = useState<Step>(1);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
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
        <Pressable onPress={goBack} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t(STEP_TITLE_KEYS[step])}</Text>
          <Text style={styles.headerStep}>{t("report.wizard.stepOf", { step })}</Text>
        </View>
      </View>

      {/* Three segments rather than a percentage bar: the wizard has exactly
          three steps, and showing them as discrete makes "one more after this"
          readable at a glance. */}
      <View style={styles.progress} accessibilityRole="progressbar">
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={[styles.progressSegment, segment <= step && styles.progressSegmentActive]}
          />
        ))}
      </View>

      {/* Scrolls, and lets a tap on a button land while the keyboard is up. With a
          plain View the keyboard could cover Submit on Step 3 and nothing scrolled
          on a small screen; and ScrollView's default swallows the first tap after
          the keyboard opens just to dismiss it — "the button didn't press". */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Step 2 is a map the user pans and drags a pin on; an enclosing scroll view
        // steals those vertical drags. It fits on one screen, so it doesn't need to.
        scrollEnabled={step !== 2}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
      >
        {step === 1 ? (
          <Step1Photo
            photoUri={photoUri}
            onCapture={setPhotoUri}
            onRetake={() => setPhotoUri(null)}
            onNext={() => setStep(2)}
          />
        ) : null}
        {step === 2 ? (
          <Step2Location coordinate={coordinate} onCoordinateChange={setCoordinate} onNext={() => setStep(3)} />
        ) : null}
        {step === 3 ? (
          <Step3Details
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            urgency={urgency}
            onUrgencyChange={setUrgency}
            onSubmit={() => {
              if (!photoUri || !coordinate) return;
              submitIncident({ photoUri, coordinate, title, description, urgency });
              setStep("success");
            }}
          />
        ) : null}
      </ScrollView>
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
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: typography.h3,
  headerStep: {
    ...typography.meta,
    fontSize: 12,
    marginTop: 1,
  },
  progress: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
});
