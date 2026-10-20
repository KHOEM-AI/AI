import { describe, it, expect } from "vitest";
import { find, findStructured } from "../find.mjs";

const MISSING = "zzq" + Date.now() + "nomatch";

describe("findStructured", () => {
  it("rejects a term shorter than 2 characters", () => {
    const r = findStructured("a");
    expect(r).toMatchObject({ ok: false, count: 0, files: 0 });
    expect(r.hits).toEqual([]);
  });

  it("rejects empty or missing terms", () => {
    expect(findStructured(undefined).ok).toBe(false);
    expect(findStructured("   ").ok).toBe(false);
  });

  it("finds a known term in the real repo", () => {
    const r = findStructured("findStructured");
    expect(r.ok).toBe(true);
    expect(r.count).toBeGreaterThan(0);
    expect(r.files).toBeGreaterThan(0);
    expect(r.hits.length).toBe(r.count);
  }, 30000);

  it("returns ok:true with count 0 when nothing matches", () => {
    const r = findStructured(MISSING);
    expect(r).toMatchObject({ ok: true, count: 0, files: 0 });
  }, 30000);
});

describe("find (text output unchanged)", () => {
  it("short term -> usage hint", () => {
    expect(find("a")).toContain("/find sendMessage");
  });

  it("no match -> not-found message", () => {
    expect(find(MISSING)).toBe(`រកមិនឃើញ "${MISSING}" ក្នុងកូដ`);
  }, 30000);

  it("match -> summary line", () => {
    expect(find("findStructured")).toMatch(/^រកឃើញ \d+ ជួរ ក្នុង \d+ ឯកសារ/);
  }, 30000);
});
