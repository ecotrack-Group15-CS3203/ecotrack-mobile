import * as Linking from "expo-linking";

export type DeepLinkTarget = {
  route: string;
  params: Record<string, string>;
};

/**
 * Hand-rolled instead of React Navigation's `linking` config prop, because that
 * config only matches against whichever navigator is currently mounted —
 * useless for a link that arrives while signed out and AuthStack (not
 * RootStack) is what's on screen. Parsing here and deciding what to do with the
 * result (navigate now vs. hold in pendingLink) happens in useDeepLinkListener.
 *
 * Extend the switch below as each target screen is built (push routing, F7).
 */
export function parseDeepLink(url: string): DeepLinkTarget | null {
  // The OIDC redirect (`ecotrack://redirect?...`) is expo-auth-session's own
  // callback, not a deep link this app should ever try to interpret — letting
  // it fall through here would misroute it or, worse, race the auth session
  // listener for the same event.
  if (url.includes("/redirect")) return null;

  const { hostname, path } = Linking.parse(url);
  // Both `ecotrack://invite/<token>` (hostname="invite") and
  // `ecotrack:///invite/<token>` (path="invite/<token>") are valid depending on
  // how the link was constructed, so normalise to one segment array.
  const segments = [hostname, ...(path?.split("/") ?? [])].filter(
    (segment): segment is string => !!segment,
  );

  if (segments[0] === "invite" && segments[1]) {
    return { route: "InviteAccept", params: { token: segments[1] } };
  }

  if (segments[0] === "incidents" && segments[1]) {
    return { route: "IncidentDetail", params: { incidentId: segments[1] } };
  }

  if (segments[0] === "tasks" && segments[1]) {
    return { route: "TaskDetail", params: { taskId: segments[1] } };
  }

  if (segments[0] === "events" && segments[1]) {
    return { route: "EventDetail", params: { eventId: segments[1] } };
  }

  return null;
}
