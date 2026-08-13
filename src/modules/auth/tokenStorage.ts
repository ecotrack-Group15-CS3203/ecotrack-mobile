import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "ecotrack.accessToken";
const REFRESH_TOKEN_KEY = "ecotrack.refreshToken";
const ID_TOKEN_KEY = "ecotrack.idToken";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
};

export const tokenStorage = {
  async save(tokens: StoredTokens): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    if (tokens.idToken) {
      await SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken);
    } else {
      await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
    }
  },

  getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  getIdToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ID_TOKEN_KEY);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
  },
};
