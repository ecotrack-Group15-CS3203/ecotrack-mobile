import { affectsMembership } from "./membershipEvents";

describe("affectsMembership", () => {
  it("flags the approval that grants a citizen their volunteer membership", () => {
    expect(affectsMembership({ type: "join_request_approved" })).toBe(true);
  });

  it("flags rejection and removal, which also change what the user may see", () => {
    expect(affectsMembership({ type: "join_request_rejected" })).toBe(true);
    expect(affectsMembership({ type: "volunteer_removed" })).toBe(true);
  });

  it("ignores pushes that leave membership alone", () => {
    expect(affectsMembership({ type: "task_assigned" })).toBe(false);
    expect(affectsMembership({ type: "incident_proximity" })).toBe(false);
  });

  it("tolerates a payload with no usable type", () => {
    expect(affectsMembership(undefined)).toBe(false);
    expect(affectsMembership({})).toBe(false);
    expect(affectsMembership({ type: 42 })).toBe(false);
  });
});
