import * as Location from "expo-location";

export type Coordinate = { latitude: number; longitude: number };

/**
 * "When in use" is a single OS-level grant - once given from any trigger, every
 * later call succeeds without re-prompting. What differs per feature is the copy
 * shown at that feature's first-use moment (SRS 3.4.9 / 3.11.3), so each rationale
 * is kept distinct rather than reusing one generic string.
 */
export const LOCATION_RATIONALE = {
  incidentReport:
    "EcoTrack uses your location to place your incident report on the map and to alert you about nearby environmental issues.",
  mapBrowse: "EcoTrack uses your location to center the map and show hazards near you.",
  joinOrganization: "EcoTrack needs your location to confirm you're within this organization's service area.",
} as const;

export async function ensureForegroundPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
}

export type PositionFix = {
  coordinate: Coordinate;
  accuracyMeters: number | null;
};

export async function getCurrentPosition(): Promise<PositionFix | null> {
  try {
    const position = await Location.getCurrentPositionAsync();
    return {
      coordinate: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      accuracyMeters: position.coords.accuracy,
    };
  } catch {
    return null;
  }
}
