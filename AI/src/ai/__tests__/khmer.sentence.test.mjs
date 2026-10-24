import { describe, expect, it } from "vitest";
import { khmerSentence } from "../khmer.mjs";

describe("khmerSentence", () => {
  it("returns a non-empty string built from the Khmer answers", () => {
    const s = khmerSentence({ random: () => 0 });
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same random function", () => {
    expect(khmerSentence({ random: () => 0.5 })).toBe(khmerSentence({ random: () => 0.5 }));
  });

  it("rejects an invalid order", () => {
    expect(() => khmerSentence({ order: 0 })).toThrow("order must be a positive integer");
  });
});
