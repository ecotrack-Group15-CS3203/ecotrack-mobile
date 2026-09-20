import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

/**
 * Remembers that this user is waiting on an organisation decision (a submitted
 * join request), so `useMe()` can poll for the membership instead of sitting
 * on a five-minute-stale row until something else happens to invalidate it.
 *
 * MMKV-backed for the same reason as pendingLink: approval typically lands
 * minutes or days later, long after the process that submitted the request has
 * been killed, so an in-memory flag would almost never survive to be useful.
 *
 * The push that announces the decision is the fast path (see
 * useMembershipSync) — this is the fallback for when it never arrives:
 * notifications permission denied, a token that was never registered, a
 * delivery dropped by the OS, or Expo Go, where no push token exists at all.
 */
const storage = createMMKV({ id: "ecotrack.membership-watch" });
const KEY = "awaitingSince";

/** A request nobody ever acts on shouldn't poll forever. A week is well past
 * the point where the answer is "no one is going to approve this". */
const WATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function readStoredStart(): number | null {
  const stored = storage.getNumber(KEY);
  if (!stored) return null;
  if (Date.now() - stored > WATCH_WINDOW_MS) {
    storage.remove(KEY);
    return null;
  }
  return stored;
}

type MembershipWatchStore = {
  /** When the pending request was submitted, or null when nothing is pending. */
  awaitingSince: number | null;
  /** Called when a join request is submitted. */
  start: () => void;
  /** Called once the membership actually lands (or the watch window closes). */
  stop: () => void;
};

export const useMembershipWatch = create<MembershipWatchStore>((set) => ({
  awaitingSince: readStoredStart(),

  start: () => {
    const now = Date.now();
    storage.set(KEY, now);
    set({ awaitingSince: now });
  },

  stop: () => {
    storage.remove(KEY);
    set({ awaitingSince: null });
  },
}));

export function isWithinWatchWindow(awaitingSince: number | null): boolean {
  return awaitingSince !== null && Date.now() - awaitingSince <= WATCH_WINDOW_MS;
}
