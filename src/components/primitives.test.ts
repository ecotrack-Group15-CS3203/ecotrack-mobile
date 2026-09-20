import { thumbFill, THUMB_FILLS } from "../theme/thumbFills";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(initialsOf("maya singh")).toBe("MS");
    expect(initialsOf("Ada Lovelace Byron")).toBe("AL");
  });

  it("handles a single name and stray spacing", () => {
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("  Maya   Singh ")).toBe("MS");
  });

  it("falls back to a placeholder rather than rendering nothing", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(null)).toBe("?");
    expect(initialsOf(undefined)).toBe("?");
  });
});

describe("thumbFill", () => {
  it("is deterministic: the same id always gets the same fill", () => {
    const id = "0c1f5d6e-8b2a-4e1c-9a3d-77e1f0a1b2c3";
    expect(thumbFill(id)).toEqual(thumbFill(id));
  });

  it("always returns one of the five fills, whatever the seed", () => {
    for (const seed of ["", "a", "événement", "x".repeat(500), "550e8400-e29b-41d4-a716-446655440000"]) {
      expect(THUMB_FILLS).toContainEqual(thumbFill(seed));
    }
  });

  it("spreads different ids across the palette rather than collapsing to one", () => {
    const used = new Set<string>();
    for (let i = 0; i < 200; i++) used.add(thumbFill(`event-${i}`).base);
    expect(used.size).toBe(THUMB_FILLS.length);
  });
});
