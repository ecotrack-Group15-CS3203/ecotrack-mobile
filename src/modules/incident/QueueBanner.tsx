import { useTranslation } from "react-i18next";
import { useNetInfo } from "@react-native-community/netinfo";

import { ErrorBanner } from "../../components/ErrorBanner";
import { tones } from "../../theme/tones";
import { useIncidentStore } from "./incidentStore";

/**
 * Status of the offline report queue, in the three states that actually differ:
 *
 * - failed  — a send was attempted and refused. Says why, and offers a retry.
 * - offline — nothing to do but wait for the network (the SRS §3.1.18 wording).
 * - sending — the device is online, so drafts are on their way; not an error.
 *
 * This used to say "waiting for connection" for every queued draft, whatever its
 * state — including on a phone that was online, where a failed upload had left
 * the draft stuck. A message that is wrong about the cause gives the user nothing
 * to act on.
 */
export function QueueBanner() {
  const { t } = useTranslation();
  const queue = useIncidentStore((state) => state.queue);
  const retryFailed = useIncidentStore((state) => state.retryFailed);
  const { isConnected } = useNetInfo();

  if (queue.length === 0) return null;

  const failed = queue.filter((draft) => draft.status === "failed");
  if (failed.length > 0) {
    return (
      <ErrorBanner
        message={t("report.queue.failed", { count: failed.length })}
        detail={failed[0].lastError}
        tone={tones.pending}
        icon="cloud-offline-outline"
        action={{ label: t("report.queue.retry"), onPress: () => void retryFailed() }}
      />
    );
  }

  // `isConnected` is null until NetInfo's first reading; only an explicit false
  // is "offline".
  if (isConnected === false) {
    return (
      <ErrorBanner
        message={t("report.queue.offline", { count: queue.length })}
        tone={tones.neutral}
        icon="cloud-offline-outline"
      />
    );
  }

  return (
    <ErrorBanner
      message={t("report.queue.sending", { count: queue.length })}
      tone={tones.verified}
      icon="cloud-upload-outline"
    />
  );
}
