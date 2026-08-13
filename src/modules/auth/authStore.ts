import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

import { tokenStorage, StoredTokens } from "./tokenStorage";

export type UserRole = "citizen" | "volunteer" | "org_admin";

type AsgardeoClaims = {
  sub: string;
  email: string;
  roles: UserRole[];
  organizationId: string | null;
};

type AuthStore = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: AsgardeoClaims | null;
  hydrate: () => Promise<void>;
  signIn: (tokens: StoredTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isHydrating: true,
  user: null,

  hydrate: async () => {
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) {
      set({ isHydrating: false });
      return;
    }
    try {
      const user = jwtDecode<AsgardeoClaims>(accessToken);
      set({ user, isAuthenticated: true, isHydrating: false });
    } catch {
      // A token that can't be decoded can never succeed later either -
      // drop it so the user lands on Login instead of crash-looping on every launch.
      await tokenStorage.clear();
      set({ isHydrating: false });
    }
  },

  signIn: async (tokens) => {
    const user = jwtDecode<AsgardeoClaims>(tokens.accessToken);
    await tokenStorage.save(tokens);
    set({ user, isAuthenticated: true });
  },

  signOut: async () => {
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
