import { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { env } from "../../config/env";
import { useAuthStore } from "./authStore";
import { tokenStorage } from "./tokenStorage";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({ scheme: "ecotrack", path: "redirect" });

export function useAsgardeoAuth() {
  const discovery = AuthSession.useAutoDiscovery(env.ASGARDEO_ISSUER);
  const signIn = useAuthStore((state) => state.signIn);
  const clearLocalSession = useAuthStore((state) => state.signOut);
  const [error, setError] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: env.ASGARDEO_MOBILE_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (!discovery || !response) return;

    if (response.type === "error") {
      setError(response.error?.message ?? "Sign-in failed");
      return;
    }
    if (response.type !== "success") return;

    setIsExchanging(true);
    setError(null);

    AuthSession.exchangeCodeAsync(
      {
        clientId: env.ASGARDEO_MOBILE_CLIENT_ID,
        code: response.params.code,
        redirectUri,
        extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      discovery
    )
      .then((tokenResponse) =>
        signIn({
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken ?? null,
          idToken: tokenResponse.idToken ?? null,
        })
      )
      .catch((exchangeError: Error) => setError(exchangeError.message))
      .finally(() => setIsExchanging(false));
  }, [response, discovery]);

  async function signOut() {
    const idToken = await tokenStorage.getIdToken();

    // Clearing local tokens isn't enough - Asgardeo keeps its own browser SSO
    // session, so without this the next "sign in" silently re-authenticates
    // as the same user instead of showing the login page.
    if (discovery?.endSessionEndpoint && idToken) {
      const logoutUrl =
        `${discovery.endSessionEndpoint}` +
        `?id_token_hint=${encodeURIComponent(idToken)}` +
        `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

      try {
        await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
      } catch {
        // Best-effort: fall through and clear the local session regardless.
      }
    }

    await clearLocalSession();
  }

  return {
    signIn: () => promptAsync(),
    signOut,
    isReady: !!request,
    isExchanging,
    error,
  };
}
