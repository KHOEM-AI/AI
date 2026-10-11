import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS } from "../assetsExtra3.mjs";
describe("assetsExtra3 (land vehicles)", () => {
  it("assets are well-formed and unique", () => {
    expect(EXTRA_ASSETS.length).toBeGreaterThanOrEqual(60);
    const seen = new Set();
    for (const a of EXTRA_ASSETS) {
      expect(a.group).toBe("vehicles");
      expect(a.nameKm.length).toBeGreaterThan(0);
      expect(a.nameEn.length).toBeGreaterThan(0);
      expect(a.alcohol).toBe(false);
      const k = a.group + "|" + a.nameKm;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });
  it("covers every price tier and every land vehicle kind", () => {
    const tags = new Set(EXTRA_ASSETS.flatMap((a) => a.tags));
    for (const t of ["poor", "middle", "rich", "luxury", "hyper", "antique", "electric"]) expect(tags.has(t)).toBe(true);
    const subs = new Set(EXTRA_ASSETS.map((a) => a.subgroup));
    for (const s of ["car", "suv", "electric", "service", "truck", "bus", "machine", "motorbike", "bicycle", "cart"]) expect(subs.has(s)).toBe(true);
  });
  it("includes key Cambodian and requested vehicles", () => {
    const t = JSON.stringify(EXTRA_ASSETS);
    for (const w of ["ឡានហៃពើរកា", "ម៉ូតូស៊ុបពើរប៊ាយ", "ម៉ូតូអគ្គិសនី", "កង់ភ្នំ", "ម៉ូតូរ៉ឺម៉ក", "ស៊ីក្លូ", "រទេះគោ", "ឡានប៉ូលិស", "ឡានក្រុងក្នុងក្រុង"]) expect(t).toContain(w);
  });
});
