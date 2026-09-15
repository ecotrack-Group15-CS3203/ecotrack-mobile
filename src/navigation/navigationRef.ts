import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * Lets code outside the component tree (a push-notification tap handler, a
 * deep-link resolved before any screen mounted) navigate without needing a
 * navigation prop. Shared by push routing (F7) and deep-link replay (F6) so
 * there's exactly one way to "go to this screen from nowhere."
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-expect-error -- generic re-export; each caller knows its own route params.
    navigationRef.navigate(name, params);
  }
}
