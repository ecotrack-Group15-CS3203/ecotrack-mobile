import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "ecotrack-mobile",
  slug: "ecotrack-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "ecotrack",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.ecotrack.mobile",
  },
  android: {
    package: "com.ecotrack.mobile",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
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
  // "no project ID configured" message. Run `eas init` to get a real project
  // ID before building for push notifications; this placeholder lets the rest
  // of the app run in Expo Go / dev builds without one.
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "00000000-0000-0000-0000-000000000000",
    },
  },
};

export default config;
