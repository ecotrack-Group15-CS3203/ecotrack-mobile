import { createMMKV } from "react-native-mmkv";

/**
 * Holds a deep link that arrived before the user was signed in, so it can be
 * replayed once `isAuthenticated` flips true. Deliberately MMKV, not a module-
 * level variable: Android routinely kills the app process while the Asgardeo
 * browser tab is foregrounded, which would wipe an in-memory value before the
 * user ever gets back to the app.
 */
const storage = createMMKV({ id: "ecotrack.pending-link" });
const KEY = "url";

export const pendingLink = {
  set(url: string): void {
    storage.set(KEY, url);
  },

  consume(): string | null {
    const url = storage.getString(KEY) ?? null;
    if (url) storage.remove(KEY);
    return url;
  },
};
