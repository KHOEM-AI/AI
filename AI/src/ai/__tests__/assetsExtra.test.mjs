import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS, EXTRA_CHARACTERS } from "../assetsExtra.mjs";

const GROUPS = ["food","fruits","vegetables","drinks","appliances","kitchenware","plants","vehicles","places","animals","people","buildings","farming","tech","valuables","fashion"];

describe("assetsExtra", () => {
  it("assets are well-formed and unique", () => {
    expect(EXTRA_ASSETS.length).toBeGreaterThanOrEqual(40);
    const seen = new Set();
    for (const a of EXTRA_ASSETS) {
      expect(GROUPS).toContain(a.group);
      expect(a.nameKm.length).toBeGreaterThan(0);
      expect(a.nameEn.length).toBeGreaterThan(0);
      expect(Array.isArray(a.tags)).toBe(true);
      const k = a.group + "|" + a.nameKm;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });
  it("covers kitchen, light, stairs, rooms, poor house and clothes", () => {
    const t = JSON.stringify(EXTRA_ASSETS);
    for (const w of ["ចង្ក្រាន","អំពូល","ជណ្ដើរយន្ត","បន្ទប់ទឹក","បន្ទប់គេង","ខ្ទម","ឯកសណ្ឋានអ្នកបម្រើ"]) expect(t).toContain(w);
  });
  it("characters are well-formed, unique and varied", () => {
    expect(EXTRA_CHARACTERS.length).toBeGreaterThanOrEqual(20);
    const names = new Set();
    const tags = new Set();
    for (const c of EXTRA_CHARACTERS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(names.has(c.name)).toBe(false);
      names.add(c.name);
      expect(Number.isInteger(c.current.age)).toBe(true);
      expect(c.current.age).toBeGreaterThan(0);
      expect(c.current.age).toBeLessThan(100);
      c.tags.forEach((x) => tags.add(x));
    }
    for (const t of ["lead","support","comic","villain","tearjerker","child"]) expect(tags.has(t)).toBe(true);
    const ages = EXTRA_CHARACTERS.map((c) => c.current.age);
    expect(Math.min(...ages)).toBeLessThanOrEqual(10);
    expect(Math.max(...ages)).toBeGreaterThanOrEqual(65);
  });
});
