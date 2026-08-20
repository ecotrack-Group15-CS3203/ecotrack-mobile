import * as Notifications from "expo-notifications";
import { create } from "zustand";

import { env } from "../../config/env";
import { apiClient } from "../../services/apiClient";
import { uploadIncidentPhoto } from "../../services/mediaUpload";
import {
  IncidentDraft,
  IncidentDraftInput,
  IncidentUrgency,
  offlineQueueService,
} from "./offlineQueueService";

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
  if (env.USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }

  const mediaUrl = await uploadIncidentPhoto(draft.photoUri);
  await apiClient.post("/v1/incidents", {
    title: draft.title,
    description: draft.description,
    location: { lat: draft.coordinate.latitude, lng: draft.coordinate.longitude },
    urgency: URGENCY_TO_API[draft.urgency],
    mediaUrls: [mediaUrl],
  });
}

type IncidentStore = {
  queue: IncidentDraft[];
  isProcessing: boolean;
  submitIncident: (input: IncidentDraftInput) => void;
  processQueue: () => Promise<void>;
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

    try {
      for (const draft of offlineQueueService.getAll()) {
        if (draft.status === "submitting") continue;

        offlineQueueService.updateStatus(draft.id, "submitting");
        set({ queue: offlineQueueService.getAll() });

        try {
          await submitDraft(draft);
          offlineQueueService.remove(draft.id);
          await notifySuccess(draft.title);
        } catch {
          offlineQueueService.updateStatus(draft.id, "failed");
          set({ queue: offlineQueueService.getAll() });
          // A failure here is almost always connectivity - stop rather than
          // burn through every later draft's presigned URL on a dead network.
          break;
        }
      }
    } finally {
      set({ queue: offlineQueueService.getAll(), isProcessing: false });
    }
  },
}));
