import * as Notifications from "expo-notifications";

/**
 * Side-effect module, imported once from App.tsx (mirrors mapboxConfig.ts's
 * set-once-at-startup pattern) — controls how a notification that arrives
 * while the app is foregrounded is presented. Without this, expo-notifications
 * silently drops foreground notifications on iOS.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
