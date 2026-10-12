import { describe, it, expect } from "vitest";
import { BODY_CHARACTERS } from "../charactersBody.mjs";

describe("charactersBody", () => {
  it("has 10 characters, 5 male and 5 female, with unique names", () => {
    expect(BODY_CHARACTERS).toHaveLength(10);
    expect(BODY_CHARACTERS.filter((c) => c.identity.gender === "male")).toHaveLength(5);
    expect(BODY_CHARACTERS.filter((c) => c.identity.gender === "female")).toHaveLength(5);
    expect(new Set(BODY_CHARACTERS.map((c) => c.name)).size).toBe(10);
  });
  it("has varied builds, heights, ages and skin tones", () => {
    const body = BODY_CHARACTERS.map((c) => c.current.body);
    expect(new Set(body).size).toBe(10);
    const t = JSON.stringify(BODY_CHARACTERS);
    for (const w of ["សាច់ដុំ", "ធាត់", "ស្ដើង", "ទាប", "ខ្ពស់ខ្លាំង", "រាងកីឡា"]) expect(t).toContain(w);
    expect(new Set(BODY_CHARACTERS.map((c) => c.identity.skinTone)).size).toBeGreaterThanOrEqual(5);
    const ages = BODY_CHARACTERS.map((c) => c.current.age);
    expect(Math.min(...ages)).toBeGreaterThan(17);
    expect(Math.max(...ages)).toBeLessThan(100);
  });
  it("is well-formed", () => {
    for (const c of BODY_CHARACTERS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.role.length).toBeGreaterThan(0);
      expect(Array.isArray(c.tags)).toBe(true);
      expect(c.identity.face.length).toBeGreaterThan(0);
    }
  });
});
