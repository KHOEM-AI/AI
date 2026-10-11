import { describe, it, expect } from "vitest";
import { EXTRA_ASSETS, EXTRA_CHARACTERS } from "../assetsExtra2.mjs";
const GROUPS = ["food","fruits","vegetables","drinks","appliances","kitchenware","plants","vehicles","places","animals","people","buildings","farming","tech","valuables","fashion"];
describe("assetsExtra2", () => {
  it("assets are well-formed and unique", () => {
    expect(EXTRA_ASSETS.length).toBeGreaterThanOrEqual(40);
    const seen = new Set();
    for (const a of EXTRA_ASSETS) {
      expect(GROUPS).toContain(a.group);
      expect(a.nameKm.length).toBeGreaterThan(0);
      expect(a.nameEn.length).toBeGreaterThan(0);
      const k = a.group + "|" + a.nameKm;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });
  it("covers meeting room, TV, pen, club, boats, cruise and hotel", () => {
    const t = JSON.stringify(EXTRA_ASSETS);
    for (const w of ["បន្ទប់ប្រជុំ","ទូរទស្សន៍","ប៊ិច","ក្លឹបយប់","ទូកដងអុំ","កប៉ាល់ទេសចរណ៍ប្រណីត","សណ្ឋាគារប្រាំផ្កាយ"]) expect(t).toContain(w);
  });
  it("only alcohol venues are flagged alcohol", () => {
    const a = EXTRA_ASSETS.filter((x) => x.alcohol).map((x) => x.nameEn);
    expect(a).toEqual(["Bar"]);
  });
  it("characters are well-formed, unique and varied", () => {
    expect(EXTRA_CHARACTERS.length).toBeGreaterThanOrEqual(12);
    const names = new Set(); const tags = new Set();
    for (const c of EXTRA_CHARACTERS) {
      expect(names.has(c.name)).toBe(false); names.add(c.name);
      expect(c.current.age).toBeGreaterThan(0);
      expect(c.current.age).toBeLessThan(100);
      expect(c.identity.skinTone).toBeUndefined();
      c.tags.forEach((x) => tags.add(x));
    }
    for (const t of ["boss","deputy","staff","partner","villain","captain"]) expect(tags.has(t)).toBe(true);
  });
});
