# EcoTrack Mobile

Mobile client for EcoTrack, a community environmental hazard reporting platform. Citizens report hazards with a photo and GPS location; volunteers track assigned cleanup tasks and events. Built with Expo (React Native, TypeScript).

## Prerequisites

- Node.js LTS
- pnpm
- Expo Go app on a physical device, or an iOS/Android simulator

## Setup

```bash
pnpm install
cp .env.example .env
pnpm start
```

Then scan the QR code with Expo Go, or press `i` / `a` in the terminal to launch a simulator.

## Environment variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Base URL of the EcoTrack API |
| `EXPO_PUBLIC_USE_MOCK_API` | When `true`, requests are served from local fixtures instead of a live backend |
| `EXPO_PUBLIC_ASGARDEO_ISSUER` | OAuth2 issuer URL for Asgardeo-based login |
| `EXPO_PUBLIC_ASGARDEO_MOBILE_CLIENT_ID` | Asgardeo client ID for the mobile app |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox access token for map rendering |

See `.env.example` for defaults.

## Scripts

- `pnpm start` — start the Metro dev server
- `pnpm android` / `pnpm ios` / `pnpm web` — start targeting a specific platform

## Project structure

```
src/
  config/       typed env wrapper
  i18n/         react-i18next setup and translations
  navigation/   navigation shell (auth stack vs. main tabs)
  services/     API client and mock API fixtures
```
