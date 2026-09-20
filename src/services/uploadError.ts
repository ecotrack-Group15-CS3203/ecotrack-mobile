/**
 * The storage PUT goes straight to S3/MinIO, not through axios, so it needs its
 * own error type: `fetch` neither rejects on an HTTP error status nor shares
 * axios's error shape, and the upload queue has to tell "couldn't reach storage"
 * (wait and retry) from "storage said no" (this one draft is stuck) — see
 * classifySubmitFailure.
 *
 * Its own file, rather than living in mediaUpload.ts, so the classifier can
 * import it without pulling in expo-image-manipulator and the axios client.
 */
export class UploadError extends Error {
  /** null when the request never got a response (unreachable host, dropped
   * connection) — the same convention as ApiError.status. */
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}
