import { AxiosError } from "axios";

import { queryClient } from "../../services/queryClient";
import { UploadError } from "../../services/uploadError";
import { RETRY_BACKOFF_MS, useIncidentStore } from "./incidentStore";
import { IncidentDraftInput, offlineQueueService } from "./offlineQueueService";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true }), addEventListener: jest.fn() },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockUpload = jest.fn();
jest.mock("../../services/mediaUpload", () => ({
  uploadIncidentPhoto: (...args: unknown[]) => mockUpload(...args),
}));

const mockCreate = jest.fn();
jest.mock("./api/incidents.api", () => ({
  incidentsApi: { create: (...args: unknown[]) => mockCreate(...args) },
}));

function input(title: string): IncidentDraftInput {
  return {
    photoUri: `file:///tmp/${title}.jpg`,
    coordinate: { latitude: 6.9, longitude: 79.8 },
    title,
    description: "",
    urgency: "High",
  };
}

function httpError(status: number): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: {},
    statusText: "",
    headers: {},
    config: {} as never,
  });
}

function titlesInQueue(): string[] {
  return offlineQueueService.getAll().map((draft) => draft.title);
}

describe("incidentStore.processQueue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUpload.mockReset().mockResolvedValue("http://storage/photo.jpg");
    mockCreate.mockReset().mockResolvedValue({ id: "incident-1" });
    for (const draft of offlineQueueService.getAll()) offlineQueueService.remove(draft.id);
    useIncidentStore.setState({ queue: [], isProcessing: false });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("sends a queued draft and removes it", async () => {
    offlineQueueService.enqueue(input("a"));
    await useIncidentStore.getState().processQueue();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(titlesInQueue()).toEqual([]);
  });

  it("refreshes the user's incident lists once a report is delivered", async () => {
    const invalidate = jest.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    offlineQueueService.enqueue(input("a"));

    await useIncidentStore.getState().processQueue();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["incidents"] });
    invalidate.mockRestore();
  });

  it("does not refresh anything for a report that failed to send", async () => {
    const invalidate = jest.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    offlineQueueService.enqueue(input("a"));
    mockCreate.mockRejectedValueOnce(httpError(400));

    await useIncidentStore.getState().processQueue();

    expect(invalidate).not.toHaveBeenCalled();
    invalidate.mockRestore();
  });

  it("keeps sending the drafts behind one the server rejected", async () => {
    // The regression this guards: any failure used to `break` the whole loop, so
    // one bad report wedged every later one.
    offlineQueueService.enqueue(input("poisoned"));
    offlineQueueService.enqueue(input("good-1"));
    offlineQueueService.enqueue(input("good-2"));
    mockCreate.mockRejectedValueOnce(httpError(400));

    await useIncidentStore.getState().processQueue();

    expect(mockCreate).toHaveBeenCalledTimes(3);
    const [remaining] = offlineQueueService.getAll();
    expect(titlesInQueue()).toEqual(["poisoned"]);
    expect(remaining.status).toBe("failed");
    expect(remaining.attempts).toBe(1);
  });

  it("stops at the first blocking failure instead of hammering a dead network", async () => {
    offlineQueueService.enqueue(input("first"));
    offlineQueueService.enqueue(input("second"));
    mockUpload.mockRejectedValue(new UploadError("Couldn't reach the photo storage server.", null));

    await useIncidentStore.getState().processQueue();

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [first, second] = offlineQueueService.getAll();
    expect(first.status).toBe("failed");
    expect(first.lastError).toMatch(/storage/i);
    expect(second.status).toBe("pending");
  });

  it("does not POST an incident when the photo upload was refused", async () => {
    offlineQueueService.enqueue(input("a"));
    mockUpload.mockRejectedValue(new UploadError("Photo upload was rejected (403).", 403));

    await useIncidentStore.getState().processQueue();

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("retries a draft left 'submitting' by a process that died mid-upload", async () => {
    const draft = offlineQueueService.enqueue(input("stranded"));
    offlineQueueService.updateStatus(draft.id, "submitting");

    await useIncidentStore.getState().processQueue();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(titlesInQueue()).toEqual([]);
  });

  it("picks up a draft that is queued while the loop is already running", async () => {
    offlineQueueService.enqueue(input("first"));
    let release!: () => void;
    mockUpload.mockImplementationOnce(() => new Promise<string>((resolve) => (release = () => resolve("u"))));

    const run = useIncidentStore.getState().processQueue();
    // Submitted mid-run: submitIncident's own processQueue() call hits the
    // isProcessing lock and returns, so only the running loop can send it.
    useIncidentStore.getState().submitIncident(input("second"));
    release();
    await run;

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(titlesInQueue()).toEqual([]);
  });

  it("still counts a delivered report as delivered when the notification fails", async () => {
    const Notifications = jest.requireMock("expo-notifications");
    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error("no channel"));
    offlineQueueService.enqueue(input("a"));
    offlineQueueService.enqueue(input("b"));

    await useIncidentStore.getState().processQueue();

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(titlesInQueue()).toEqual([]);
  });

  it("retries a failed draft on the backoff schedule while the app stays online", async () => {
    offlineQueueService.enqueue(input("a"));
    mockCreate.mockRejectedValueOnce(httpError(503));

    await useIncidentStore.getState().processQueue();
    expect(offlineQueueService.getAll()[0].status).toBe("failed");

    await jest.advanceTimersByTimeAsync(RETRY_BACKOFF_MS[0]);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(titlesInQueue()).toEqual([]);
  });

  it("gives up on automatic retries after the schedule is exhausted", async () => {
    offlineQueueService.enqueue(input("a"));
    mockCreate.mockRejectedValue(httpError(503));

    await useIncidentStore.getState().processQueue();
    for (const delay of RETRY_BACKOFF_MS) await jest.advanceTimersByTimeAsync(delay);
    const callsAtCap = mockCreate.mock.calls.length;
    await jest.advanceTimersByTimeAsync(RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1] * 2);

    expect(mockCreate).toHaveBeenCalledTimes(callsAtCap);
    expect(offlineQueueService.getAll()[0].status).toBe("failed");
  });

  it("retryFailed gives a draft that ran out of attempts a fresh set", async () => {
    const draft = offlineQueueService.enqueue(input("a"));
    offlineQueueService.updateStatus(draft.id, "failed", { attempts: 9, lastError: "old" });

    await useIncidentStore.getState().retryFailed();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(titlesInQueue()).toEqual([]);
  });
});
