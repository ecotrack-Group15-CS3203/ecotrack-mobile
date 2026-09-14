import { AxiosError } from "axios";

/**
 * Nest's default exception filter shape: `message` is a single string for most
 * thrown exceptions, but an array of strings for ValidationPipe failures (one
 * entry per failed field/decorator).
 */
type NestErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

/**
 * Normalised shape every screen can render directly, instead of each one having
 * to know that axios errors look nothing like Nest's error bodies and that a
 * network failure (no `response` at all) is a third, different shape again.
 */
export class ApiError extends Error {
  readonly status: number | null;
  /** True when the request never reached the server (offline, timeout, DNS) —
   * screens use this to show "check your connection" instead of the server's
   * (nonexistent) message. */
  readonly isNetworkError: boolean;

  constructor(message: string, status: number | null, isNetworkError: boolean) {
    super(message);
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * class-validator messages are already human-readable ("radius must be one of
 * the following values: 1000, 5000, ..."), so the first one is shown as-is
 * rather than concatenating the whole array into a wall of text.
 */
function extractMessage(body: NestErrorBody | undefined): string | null {
  if (!body?.message) return null;
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return new ApiError(
      error instanceof Error ? error.message : "Something went wrong.",
      null,
      false,
    );
  }

  if (!error.response) {
    // Covers both "no connection at all" and axios's own ECONNABORTED timeout —
    // from the screen's point of view both mean "couldn't reach the server."
    return new ApiError(
      "Couldn't reach EcoTrack. Check your connection and try again.",
      null,
      true,
    );
  }

  const body = error.response.data as NestErrorBody | undefined;
  const message = extractMessage(body) ?? defaultMessageForStatus(error.response.status);
  return new ApiError(message, error.response.status, false);
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "That couldn't be found — it may have been removed.";
    case 409:
      return "That conflicts with something that changed. Please refresh and try again.";
    case 422:
      return "That request couldn't be processed as-is.";
    default:
      return status >= 500
        ? "EcoTrack is having trouble right now. Please try again shortly."
        : "Something went wrong.";
  }
}
