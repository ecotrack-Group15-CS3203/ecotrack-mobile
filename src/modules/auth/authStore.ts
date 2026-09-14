import { create } from "zustand";

import { tokenStorage, StoredTokens } from "./tokenStorage";

/**
 * Tokens and auth status only — no decoded JWT claims. The backend resolves
 * role/organisationId from the `users` table on every request (see useMe.ts),
 * and mirroring that in a locally-decoded claim invites exactly the kind of
 * staleness bug it's meant to avoid: right after an invite-accept or join
 * approval, the access token still carries the old claims until its next
 * refresh, while `useMe()` reflects the change immediately.
 */
type AuthStore = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  signIn: (tokens: StoredTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isHydrating: true,

  hydrate: async () => {
    const accessToken = await tokenStorage.getAccessToken();
    set({ isAuthenticated: !!accessToken, isHydrating: false });
  },

  signIn: async (tokens) => {
    await tokenStorage.save(tokens);
    set({ isAuthenticated: true });
  },

  signOut: async () => {
    await tokenStorage.clear();
    set({ isAuthenticated: false });
  },
}));
