import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS } from "../assetsExtra4.mjs";
import { EXTRA_ASSETS as V3 } from "../assetsExtra3.mjs";
describe("assetsExtra4 (water, rail, air, space, future)", () => {
  it("assets are well-formed and unique", () => {
    expect(EXTRA_ASSETS.length).toBeGreaterThanOrEqual(45);
    const seen = new Set();
    for (const a of EXTRA_ASSETS) {
      expect(a.group).toBe("vehicles");
      expect(a.nameKm.length).toBeGreaterThan(0);
      expect(a.nameEn.length).toBeGreaterThan(0);
      expect(a.alcohol).toBe(false);
      expect(seen.has(a.nameKm)).toBe(false);
      seen.add(a.nameKm);
    }
  });
  it("does not repeat names from assetsExtra3", () => {
    const v3 = new Set(V3.map((a) => a.nameKm));
    for (const a of EXTRA_ASSETS) expect(v3.has(a.nameKm)).toBe(false);
  });
  it("covers water, rail, air, space and future", () => {
    const tags = new Set(EXTRA_ASSETS.flatMap((a) => a.tags));
    for (const t of ["water", "rail", "air", "space", "future"]) expect(tags.has(t)).toBe(true);
    const t = JSON.stringify(EXTRA_ASSETS);
    for (const w of ["ម៉ូតូទឹក", "រថភ្លើងល្បឿនលឿន", "ឧទ្ធម្ភាគចក្រ", "គ្រាប់រ៉ុក្កែតអវកាស", "ឡានហោះ", "ម៉ូតូអនាគតអណ្តែត"]) expect(t).toContain(w);
  });
});
