const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === "true";
};

export const env = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1",
  USE_MOCK_API: parseBoolean(process.env.EXPO_PUBLIC_USE_MOCK_API, true),
  ASGARDEO_ISSUER: process.env.EXPO_PUBLIC_ASGARDEO_ISSUER ?? "",
  ASGARDEO_MOBILE_CLIENT_ID: process.env.EXPO_PUBLIC_ASGARDEO_MOBILE_CLIENT_ID ?? "",
  MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
} as const;
