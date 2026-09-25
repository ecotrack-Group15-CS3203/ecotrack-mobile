import { ExpoConfig } from "expo/config";
import { withGradleProperties } from "expo/config-plugins";

const config: ExpoConfig = {
  name: "EcoTrack",
  slug: "ecotrack-mobile",
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  primaryColor: "#2E7D32",
  scheme: "ecotrack",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.ecotrack.mobile",
  },
  android: {
    package: "com.ecotrack.mobile",
    adaptiveIcon: {
      backgroundColor: "#0E3B2E",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        // imageWidth must match SPLASH_MARK_SIZE in src/components/brand/BootScreen.tsx
        // so the JS boot screen picks up with the mark in the same place. Android 12+
        // masks the splash icon to a 192dp circle, so the mark (taller than wide)
        // must stay well under 192dp or its top and bottom points get clipped.
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#0E3B2E",
      },
    ],
    "expo-font",
    "expo-secure-store",
    "expo-web-browser",
    "@rnmapbox/maps",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "EcoTrack uses your location to place your incident report on the map and to alert you about nearby environmental issues.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "EcoTrack uses your camera to capture photos of environmental hazards for incident reports.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "EcoTrack uses your photos to attach evidence to incident reports.",
        microphonePermission: false,
      },
    ],
    "expo-notifications",
  ],
  // getExpoPushTokenAsync (pushRegistration.ts, F7) requires this — without it
  // the call fails at runtime with a non-obvious error rather than a clear
  // "no project ID configured" message. This is the ID of the EAS project
  // @rashmikams-team/ecotrack-mobile; a project ID is public, not a secret.
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "264a46d8-bf6a-40aa-aebe-4a3a65ed1f6a",
    },
  },
};

// Opt-in via ANDROID_ARCHS (set on the EAS "preview" profile). Every real device is
// arm64, and the other ABIs are ~60% of the APK. Local dev builds and emulators leave
// it unset and keep all four.
const androidArchs = process.env.ANDROID_ARCHS;

export default androidArchs
  ? withGradleProperties(config, (c) => {
      const prop = c.modResults.find((p) => p.type === "property" && p.key === "reactNativeArchitectures");
      if (prop?.type === "property") prop.value = androidArchs;
      else c.modResults.push({ type: "property", key: "reactNativeArchitectures", value: androidArchs });
      return c;
    })
  : config;
