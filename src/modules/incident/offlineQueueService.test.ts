import { offlineQueueService, IncidentDraftInput } from "./offlineQueueService";

const SAMPLE_INPUT: IncidentDraftInput = {
  photoUri: "file:///tmp/photo.jpg",
  coordinate: { latitude: 6.9271, longitude: 79.8612 },
  title: "Illegal dumping",
  description: "Debris pile near the canal",
  urgency: "High",
};

describe("offlineQueueService", () => {
  afterEach(() => {
    // Every draft this suite created should be gone by the time the next
    // test runs — mirrors production usage, where a draft only ever leaves
    // the queue via an explicit remove(), never a silent reset.
    for (const draft of offlineQueueService.getAll()) {
      offlineQueueService.remove(draft.id);
    }
  });

  it("starts empty", () => {
    expect(offlineQueueService.getAll()).toEqual([]);
  });

  it("enqueues a draft with a generated id, pending status, and a timestamp", () => {
    const draft = offlineQueueService.enqueue(SAMPLE_INPUT);
    expect(draft.id).toBeTruthy();
    expect(draft.status).toBe("pending");
    expect(draft.createdAt).toBeGreaterThan(0);
    expect(draft.title).toBe(SAMPLE_INPUT.title);
  });

  it("persists an enqueued draft across separate getAll() calls", () => {
    // "Survives a simulated app restart": offlineQueueService itself has no
    // in-memory cache of its own — every method re-reads from storage — so
    // this already proves a fresh read sees what a prior write persisted,
    // which is the property that matters (the underlying MMKV instance's own
    // on-disk durability is react-native-mmkv's responsibility, not this
    // module's, and isn't something a Node-side mock could prove anyway).
    const draft = offlineQueueService.enqueue(SAMPLE_INPUT);
    const reread = offlineQueueService.getAll();
    expect(reread).toHaveLength(1);
    expect(reread[0]).toEqual(draft);
  });

  it("orders drafts oldest-first, matching submission order for the retry queue", () => {
    const first = offlineQueueService.enqueue({ ...SAMPLE_INPUT, title: "first" });
    const second = offlineQueueService.enqueue({ ...SAMPLE_INPUT, title: "second" });
    const all = offlineQueueService.getAll();
    expect(all.map((d) => d.id)).toEqual([first.id, second.id]);
  });

  it("updates a draft's status without disturbing other fields", () => {
    const draft = offlineQueueService.enqueue(SAMPLE_INPUT);
    offlineQueueService.updateStatus(draft.id, "failed");
    const [updated] = offlineQueueService.getAll();
    expect(updated.status).toBe("failed");
    expect(updated.title).toBe(SAMPLE_INPUT.title);
  });

  it("updateStatus on an unknown id is a no-op, not an error", () => {
    offlineQueueService.enqueue(SAMPLE_INPUT);
    expect(() => offlineQueueService.updateStatus("does-not-exist", "failed")).not.toThrow();
    expect(offlineQueueService.getAll()).toHaveLength(1);
  });

  it("removes a draft by id, leaving the rest of the queue intact", () => {
    const keep = offlineQueueService.enqueue({ ...SAMPLE_INPUT, title: "keep" });
    const drop = offlineQueueService.enqueue({ ...SAMPLE_INPUT, title: "drop" });
    offlineQueueService.remove(drop.id);
    const remaining = offlineQueueService.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(keep.id);
  });

  it("remove on an unknown id is a no-op, not an error", () => {
    offlineQueueService.enqueue(SAMPLE_INPUT);
    expect(() => offlineQueueService.remove("does-not-exist")).not.toThrow();
    expect(offlineQueueService.getAll()).toHaveLength(1);
  });
});
