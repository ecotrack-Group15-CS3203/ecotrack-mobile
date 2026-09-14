import { createMMKV } from "react-native-mmkv";

import type { DeepLinkTarget } from "./deepLinking";

/**
 * Holds a deep link that arrived before the user was signed in, so it can be
 * replayed once `isAuthenticated` flips true. Deliberately MMKV, not a module-
 * level variable: Android routinely kills the app process while the Asgardeo
 * browser tab is foregrounded, which would wipe an in-memory value before the
 * user ever gets back to the app. Stores the already-parsed {route, params}
 * rather than the raw URL, so replay is a direct navigate() call — no need to
 * round-trip back through the OS and this app's own Linking listener.
 */
const storage = createMMKV({ id: "ecotrack.pending-link" });
const KEY = "target";

export const pendingLink = {
  set(target: DeepLinkTarget): void {
    storage.set(KEY, JSON.stringify(target));
  },

  consume(): DeepLinkTarget | null {
    const raw = storage.getString(KEY);
    if (!raw) return null;
    storage.remove(KEY);
    try {
      return JSON.parse(raw) as DeepLinkTarget;
    } catch {
      return null;
    }
  },
};
