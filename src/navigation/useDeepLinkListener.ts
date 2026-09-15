import { useEffect } from "react";
import * as Linking from "expo-linking";

import { useAuthStore } from "../modules/auth/authStore";
import { parseDeepLink } from "./deepLinking";
import { navigate, navigationRef } from "./navigationRef";
import { pendingLink } from "./pendingLink";

/**
 * Cold-start URL + subsequent 'url' events, both routed through the same
 * handler. Mounted once from NavigationShell regardless of auth state (unlike
 * React Navigation's own `linking` prop, which only matches routes in
 * whichever navigator happens to be mounted right now — no good for a link
 * that arrives while AuthStack, not RootStack, is on screen).
 */
export function useDeepLinkListener() {
  useEffect(() => {
    function handle(url: string) {
      const target = parseDeepLink(url);
      if (!target) return;

      if (useAuthStore.getState().isAuthenticated && navigationRef.isReady()) {
        navigate(target.route, target.params);
      } else {
        // Not ready to navigate yet (signed out, or the container hasn't
        // mounted) — hold it for NavigationShell's post-sign-in replay.
        pendingLink.set(target);
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => subscription.remove();
  }, []);
}
