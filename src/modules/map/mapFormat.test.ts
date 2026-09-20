import { firstName, formatDistance, greetingPeriod, parseTimestamp, timeAgo } from "./mapFormat";

describe("greetingPeriod", () => {
  it.each([
    [0, "morning"],
    [5, "morning"],
    [11, "morning"],
    [12, "afternoon"],
    [17, "afternoon"],
    [18, "evening"],
    [23, "evening"],
  ])("hour %i is %s", (hour, expected) => {
    expect(greetingPeriod(hour)).toBe(expected);
  });
});

describe("firstName", () => {
  it("takes the first word and normalises its case", () => {
    expect(firstName("maya singh")).toBe("Maya");
    expect(firstName("RASHMIKA MADAELA")).toBe("Rashmika");
  });

  it("returns null when there is nothing to greet", () => {
    expect(firstName("")).toBeNull();
    expect(firstName("   ")).toBeNull();
    expect(firstName(null)).toBeNull();
    expect(firstName(undefined)).toBeNull();
  });
});

describe("formatDistance", () => {
  it("uses metres under a kilometre", () => {
    expect(formatDistance(350)).toBe("350 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("never reports zero metres for something nearby", () => {
    expect(formatDistance(0)).toBe("1 m");
    expect(formatDistance(0.2)).toBe("1 m");
  });

  it("uses one decimal of a kilometre from 1 km up", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1234)).toBe("1.2 km");
    expect(formatDistance(12500)).toBe("12.5 km");
  });
});

describe("timeAgo", () => {
  // A stand-in translator that exposes the key and count, so the test asserts the
  // bucketing without depending on the English copy.
  const t = (key: string, options?: Record<string, unknown>) => `${key}${options ? `:${options.count}` : ""}`;
  const now = Date.parse("2026-09-21T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("buckets into just-now, minutes, hours and days", () => {
    expect(timeAgo(ago(20_000), t, now)).toBe("common.timeAgo.justNow");
    expect(timeAgo(ago(5 * 60_000), t, now)).toBe("common.timeAgo.minutes:5");
    expect(timeAgo(ago(2 * 3_600_000), t, now)).toBe("common.timeAgo.hours:2");
    expect(timeAgo(ago(3 * 86_400_000), t, now)).toBe("common.timeAgo.days:3");
  });

  it("treats a timestamp slightly in the future (clock skew) as just now", () => {
    expect(timeAgo(ago(-30_000), t, now)).toBe("common.timeAgo.justNow");
  });
});

describe("parseTimestamp", () => {
  const expected = Date.parse("2026-09-20T20:28:07.293Z");

  it("reads standard ISO 8601 unchanged", () => {
    expect(parseTimestamp("2026-09-20T20:28:07.293Z")).toBe(expected);
    expect(parseTimestamp("2026-09-20T20:28:07.293+00:00")).toBe(expected);
  });

  it("reads Postgres's text format, which Hermes cannot parse natively", () => {
    // Exactly what /incidents/nearby returned: space, microseconds, bare +00.
    expect(parseTimestamp("2026-09-20 20:28:07.293696+00")).toBe(expected);
  });

  it("keeps a non-UTC offset meaning the same instant", () => {
    expect(parseTimestamp("2026-09-21 01:28:07.293+05")).toBe(expected);
    expect(parseTimestamp("2026-09-20 15:28:07.293-05")).toBe(expected);
  });

  it("reads a timestamp with no fractional seconds", () => {
    expect(parseTimestamp("2026-09-20 20:28:07+00")).toBe(Date.parse("2026-09-20T20:28:07Z"));
  });

  it("returns NaN for garbage rather than throwing", () => {
    expect(Number.isNaN(parseTimestamp("not a date"))).toBe(true);
  });
});

describe("timeAgo with the Postgres format", () => {
  const t = (key: string, options?: Record<string, unknown>) => `${key}${options ? `:${options.count}` : ""}`;
  const now = Date.parse("2026-09-21T20:28:07.293Z");

  it("buckets a Postgres-format timestamp instead of returning NaN", () => {
    expect(timeAgo("2026-09-20 20:28:07.293696+00", t, now)).toBe("common.timeAgo.days:1");
  });

  it("returns null for an unreadable timestamp", () => {
    expect(timeAgo("garbage", t, now)).toBeNull();
  });
});
