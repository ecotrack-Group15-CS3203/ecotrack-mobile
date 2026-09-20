import { toApiError } from "../../services/apiError";
import { UploadError } from "../../services/uploadError";

export type SubmitFailure = {
  /**
   * `blocking`: the problem is the path to the server, not this draft — no other
   * draft would fare any better right now, so the queue stops and waits (for the
   * network to come back, or for the backoff timer).
   *
   * `isolated`: the server or storage answered and said no to *this* draft. Later
   * drafts are unrelated, so the queue moves on to them instead of letting one
   * bad report wedge every report behind it.
   */
  scope: "blocking" | "isolated";
  /** Shown to the user under the failed-report banner. */
  message: string;
};

/**
 * Sorts a failed submission into blocking vs isolated. Before this existed every
 * failure was treated as "probably connectivity" and broke out of the whole
 * queue, so a single 4xx (or a photo upload the storage server refused) left
 * every later report waiting forever behind it.
 */
export function classifySubmitFailure(error: unknown): SubmitFailure {
  if (error instanceof UploadError) {
    // No response at all, or storage itself is unwell: waiting can fix it, and
    // it would fail the same way for the next draft.
    if (error.status === null || error.status >= 500) {
      return { scope: "blocking", message: error.message };
    }
    return { scope: "isolated", message: error.message };
  }

  const apiError = toApiError(error);

  // 401 reaches here only after the interceptor's one refresh attempt failed —
  // a session problem, so every draft would hit it too.
  if (apiError.isNetworkError || apiError.status === 401 || (apiError.status !== null && apiError.status >= 500)) {
    return { scope: "blocking", message: apiError.message };
  }

  return { scope: "isolated", message: apiError.message };
}
