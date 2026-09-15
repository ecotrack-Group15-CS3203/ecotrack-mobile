import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { authApi } from "../auth/api/auth.api";

/**
 * Registers this device for push notifications, but only ever prompts for
 * the OS permission — never silently registers without one (SRS §3.1.4: "no
 * notification is ever sent to a user who hasn't opted in"). Call after
 * sign-in; safe to call on every app start, since a previously-granted
 * permission just re-resolves to the same token without a second prompt, and
 * a previously-denied one is respected rather than re-asked.
 */
export async function registerForPushNotifications(): Promise<void> {
  // Push tokens require a physical device — simulators/most emulators have no
  // APNs/FCM backing, and getExpoPushTokenAsync throws on them.
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
  await authApi.registerPushToken(expoPushToken);
}
