import { randomUUID } from "expo-crypto";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "offline-queue" });
const QUEUE_KEY = "incidentDrafts";

export type IncidentDraftStatus = "pending" | "submitting" | "failed";

export type IncidentUrgency = "Low" | "Medium" | "High" | "Critical";

export type IncidentDraftInput = {
  photoUri: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  description: string;
  urgency: IncidentUrgency;
};

export type IncidentDraft = IncidentDraftInput & {
  id: string;
  status: IncidentDraftStatus;
  createdAt: number;
  /** Failed submission attempts so far. Optional because drafts persisted before
   * this field existed don't carry it — read it as `attempts ?? 0`. */
  attempts?: number;
  /** Why the last attempt failed, in words fit to show the user. */
  lastError?: string;
};

/** Extra state recorded alongside a status change. `lastError: null` clears it. */
export type DraftStatusDetails = { attempts?: number; lastError?: string | null };

function readAll(): IncidentDraft[] {
  const raw = storage.getString(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as IncidentDraft[]) : [];
}

function writeAll(drafts: IncidentDraft[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(drafts));
}

export const offlineQueueService = {
  // Always sorted oldest-first so the retry queue processes drafts in submission order.
  getAll(): IncidentDraft[] {
    return readAll().sort((a, b) => a.createdAt - b.createdAt);
  },

  enqueue(input: IncidentDraftInput): IncidentDraft {
    const draft: IncidentDraft = {
      ...input,
      id: randomUUID(),
      status: "pending",
      createdAt: Date.now(),
    };
    writeAll([...readAll(), draft]);
    return draft;
  },

  updateStatus(id: string, status: IncidentDraftStatus, details: DraftStatusDetails = {}): void {
    writeAll(
      readAll().map((draft) => {
        if (draft.id !== id) return draft;
        const next: IncidentDraft = { ...draft, status };
        if (details.attempts !== undefined) next.attempts = details.attempts;
        if (details.lastError === null) delete next.lastError;
        else if (details.lastError !== undefined) next.lastError = details.lastError;
        return next;
      }),
    );
  },

  remove(id: string): void {
    writeAll(readAll().filter((draft) => draft.id !== id));
  },
};
