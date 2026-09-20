import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { create } from "zustand";

import { uploadIncidentPhoto } from "../../services/mediaUpload";
import { incidentsApi } from "./api/incidents.api";
import {
  IncidentDraft,
  IncidentDraftInput,
  IncidentUrgency,
  offlineQueueService,
} from "./offlineQueueService";
import { classifySubmitFailure } from "./submitFailure";

/**
 * Delays before automatic retries of a failed draft, indexed by failed attempts
 * so far. Retries used to happen only on app start or on an offline -> online
 * transition, so a phone that stayed online the whole time never retried at all
 * and the draft sat "waiting for connection" indefinitely. After the last delay
 * the draft stays failed until the user taps retry, or the network next changes.
 */
export const RETRY_BACKOFF_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];

const URGENCY_TO_API: Record<IncidentUrgency, "low" | "medium" | "high" | "critical"> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

async function notifySuccess(title: string): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) return;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: "Report submitted", body: `Your report "${title}" was submitted.` },
    trigger: null,
  });
}

async function submitDraft(draft: IncidentDraft): Promise<void> {
  const mediaUrl = await uploadIncidentPhoto(draft.photoUri);
  await incidentsApi.create({
    title: draft.title,
    description: draft.description,
    location: { lat: draft.coordinate.latitude, lng: draft.coordinate.longitude },
    urgency: URGENCY_TO_API[draft.urgency],
    mediaUrls: [mediaUrl],
  });
}

let retryTimer: ReturnType<typeof setTimeout> | null = null;

function clearRetryTimer(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

type IncidentStore = {
  queue: IncidentDraft[];
  isProcessing: boolean;
  submitIncident: (input: IncidentDraftInput) => void;
  processQueue: () => Promise<void>;
  /** The banner's "Retry": forgets the backoff history so a draft that ran out of
   * automatic attempts gets a fresh set, then sends everything that is waiting. */
  retryFailed: () => Promise<void>;
};

export const useIncidentStore = create<IncidentStore>((set, get) => ({
  queue: offlineQueueService.getAll(),
  isProcessing: false,

  // Enqueues synchronously so the wizard can navigate to the confirmation
  // screen immediately - the actual network submission happens in the
  // background via processQueue, whether that resolves instantly (online)
  // or stays queued for later (offline). There is no separate online path.
  submitIncident: (input) => {
    offlineQueueService.enqueue(input);
    set({ queue: offlineQueueService.getAll() });
    void get().processQueue();
  },

  processQueue: async () => {
    if (get().isProcessing) return;
    set({ isProcessing: true });
    clearRetryTimer();

    // Drafts already tried in this run. The queue is re-read on every iteration
    // rather than snapshotted, so a report submitted while an earlier one is
    // still uploading joins this run instead of sitting `pending` until the next
    // app start (submitIncident's own processQueue call returns early on the
    // isProcessing lock).
    const attempted = new Set<string>();
    let blocked = false;

    try {
      while (!blocked) {
        // A draft still marked "submitting" here was left by a process that died
        // mid-upload: the isProcessing lock means nothing in this session can own
        // it. It used to be skipped, so it stayed stuck forever.
        const draft = offlineQueueService.getAll().find((candidate) => !attempted.has(candidate.id));
        if (!draft) break;
        attempted.add(draft.id);

        offlineQueueService.updateStatus(draft.id, "submitting");
        set({ queue: offlineQueueService.getAll() });

        try {
          await submitDraft(draft);
          offlineQueueService.remove(draft.id);
        } catch (error) {
          const failure = classifySubmitFailure(error);
          offlineQueueService.updateStatus(draft.id, "failed", {
            attempts: (draft.attempts ?? 0) + 1,
            lastError: failure.message,
          });
          set({ queue: offlineQueueService.getAll() });
          // Only a problem with the path to the server stops the queue — sending
          // the next draft would fail identically. A server that answered "no" to
          // this one draft says nothing about the ones behind it.
          if (failure.scope === "blocking") blocked = true;
          continue;
        }

        // Outside the submit try/catch: a failed notification must not mark an
        // already-delivered report as failed, or stop the queue.
        await notifySuccess(draft.title).catch(() => undefined);
      }
    } finally {
      set({ queue: offlineQueueService.getAll(), isProcessing: false });
      scheduleRetry();
    }
  },

  retryFailed: async () => {
    for (const draft of offlineQueueService.getAll()) {
      if (draft.status === "failed") {
        offlineQueueService.updateStatus(draft.id, "pending", { attempts: 0, lastError: null });
      }
    }
    set({ queue: offlineQueueService.getAll() });
    await get().processQueue();
  },
}));

/** Arms one timer for the next automatic retry, if a failed draft still has
 * backoff left. Re-armed after every run, so it chains until the schedule is
 * exhausted or the queue drains. */
function scheduleRetry(): void {
  clearRetryTimer();

  const next = offlineQueueService
    .getAll()
    .find((draft) => draft.status === "failed" && (draft.attempts ?? 0) <= RETRY_BACKOFF_MS.length);
  if (!next) return;

  const delay = RETRY_BACKOFF_MS[Math.max((next.attempts ?? 1) - 1, 0)];
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    // Offline, retrying just burns an attempt; the NetInfo listener in
    // useNetworkQueueSync restarts the queue the moment the network returns.
    const network = await NetInfo.fetch();
    if (network.isConnected) void useIncidentStore.getState().processQueue();
  }, delay);
}
