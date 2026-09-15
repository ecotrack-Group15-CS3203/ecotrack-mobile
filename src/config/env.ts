/**
 * Normalises the configured host into exactly one `/v1` suffix, so call sites
 * can use bare paths (`/incidents`) without anyone having to remember whether
 * the env var already carried the version. Teammates' existing `.env` files end
 * in `/v1`; a bare host works equally well.
 */
const normaliseApiBaseUrl = (raw: string): string =>
  `${raw.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`;

export const env = {
  API_BASE_URL: normaliseApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  ),
  ASGARDEO_ISSUER: process.env.EXPO_PUBLIC_ASGARDEO_ISSUER ?? "",
  ASGARDEO_MOBILE_CLIENT_ID: process.env.EXPO_PUBLIC_ASGARDEO_MOBILE_CLIENT_ID ?? "",
  MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
} as const;
