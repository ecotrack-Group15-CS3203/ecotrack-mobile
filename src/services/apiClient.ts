import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as AuthSession from "expo-auth-session";

import { env } from "../config/env";
import { useAuthStore } from "../modules/auth/authStore";
import { tokenStorage } from "../modules/auth/tokenStorage";

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  // Without a timeout a request on a dead mobile connection hangs indefinitely,
  // and every loading state that awaits it hangs with it.
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const discovery = await AuthSession.resolveDiscoveryAsync(env.ASGARDEO_ISSUER);
  const tokenResponse = await AuthSession.refreshAsync(
    { clientId: env.ASGARDEO_MOBILE_CLIENT_ID, refreshToken },
    discovery
  );

  await tokenStorage.save({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? refreshToken,
    idToken: tokenResponse.idToken ?? null,
  });

  return tokenResponse.accessToken;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }
    originalRequest._retried = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      await useAuthStore.getState().signOut();
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
    return apiClient(originalRequest);
  }
);
