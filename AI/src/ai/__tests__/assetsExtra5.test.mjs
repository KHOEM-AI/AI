import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS } from "../assetsExtra5.mjs";
describe("assetsExtra5 (marine life and plants)", () => {
  it("assets are well-formed and unique", () => {
    expect(EXTRA_ASSETS.length).toBeGreaterThanOrEqual(100);
    const seen = new Set();
    for (const a of EXTRA_ASSETS) {
      expect(["animals", "plants"]).toContain(a.group);
      expect(a.nameKm.length).toBeGreaterThan(0);
      expect(a.nameEn.length).toBeGreaterThan(0);
      expect(a.appearance.length).toBeGreaterThan(5);
      expect(a.alcohol).toBe(false);
      expect(seen.has(a.nameKm)).toBe(false);
      seen.add(a.nameKm);
    }
  });
  it("covers small to large and plants", () => {
    const tags = new Set(EXTRA_ASSETS.flatMap((a) => a.tags));
    for (const t of ["small", "medium", "large", "reef", "deep", "venom"]) expect(tags.has(t)).toBe(true);
    expect(EXTRA_ASSETS.filter((a) => a.group === "plants").length).toBeGreaterThanOrEqual(15);
    const s = JSON.stringify(EXTRA_ASSETS);
    for (const w of ["ត្រីក្លោន", "ត្រីឆ្លាមស", "បាឡែនខៀវ", "អណ្តើកសមុទ្របៃតង", "បង្កងសមុទ្រ", "មឹកយក្ស", "ផ្កាថ្មខួរក្បាល", "សារាយកេលយក្ស", "ស្មៅអណ្តើក", "ដើមកោងកាងក្រហម"]) expect(s).toContain(w);
  });
});
