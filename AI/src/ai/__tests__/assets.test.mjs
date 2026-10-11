import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAsset, searchAssets, pickForStory, seedAssets } from "../assets.mjs";
import { SEED_ASSETS } from "../assetsSeed.mjs";
import { GROUPS, batch, createItem, listItems } from "../library.mjs";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "assets-"));
  process.env.LIBRARY_FILE = path.join(dir, "library.json");
});
afterEach(() => {
  delete process.env.LIBRARY_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("assets seed data", () => {
  it("uses only valid library groups and has a name on every row", () => {
    for (const s of SEED_ASSETS) {
      expect(GROUPS).toContain(s.group);
      expect(s.nameKm || s.nameEn).toBeTruthy();
    }
  });
});

describe("assets.mjs", () => {
  it("creates an asset with catalog fields and depictionOnly", () => {
    const r = createAsset({ group: "appliances", nameKm: "ទូរទស្សន៍", nameEn: "Television", actions: ["បើក", "បិទ"] });
    expect(r.ok).toBe(true);
    expect(r.item.data).toMatchObject({ nameEn: "Television", region: "global", depictionOnly: true, alcohol: false });
    expect(r.item.data.actions).toEqual(["បើក", "បិទ"]);
  });

  it("does not duplicate by Khmer or English name", () => {
    createAsset({ group: "fruits", nameKm: "ស្វាយ", nameEn: "Mango" });
    const r = createAsset({ group: "fruits", nameEn: "mango" });
    expect(r.duplicate).toBe(true);
    expect(searchAssets({ group: "fruits" })).toHaveLength(1);
  });

  it("rejects empty names and bad groups", () => {
    expect(createAsset({ group: "food" }).reason).toBe("empty_name");
    expect(createAsset({ group: "nope", nameEn: "x" }).reason).toBe("bad_group");
  });

  it("seeds idempotently and marks seed as source ai", () => {
    const a = seedAssets();
    expect(a.failed).toBe(0);
    expect(a.added).toBe(SEED_ASSETS.length);
    const b = seedAssets();
    expect(b.added).toBe(0);
    expect(b.skipped).toBe(SEED_ASSETS.length);
    expect(searchAssets({ q: "amok" })[0].source).toBe("ai");
  });

  it("searches by Khmer text, country and alcohol flag", () => {
    seedAssets();
    expect(searchAssets({ q: "ម៉ាស៊ីនត្រជាក់" })).toHaveLength(1);
    expect(searchAssets({ country: "KH", group: "food" }).length).toBeGreaterThanOrEqual(3);
    expect(searchAssets({ alcohol: true }).map((i) => i.data.nameEn)).toEqual(["Beer"]);
  });

  it("pickForStory ranks country first, falls back to global, can exclude alcohol", () => {
    seedAssets();
    const kh = pickForStory({ country: "KH", region: "asia", groups: ["food", "drinks"], limit: 50 });
    expect(kh[0].data.country).toBe("KH");
    expect(kh.some((i) => i.data.country === "JP")).toBe(false); // ប្រទេសផ្សេងមិនលាយ
    expect(kh.some((i) => i.data.region === "global")).toBe(true);
    const kids = pickForStory({ groups: ["drinks"], alcohol: false });
    expect(kids.some((i) => i.data.alcohol)).toBe(false);
  });

  it("seed covers all 16 library groups with no duplicate names per group", () => {
    expect(new Set(SEED_ASSETS.map((s) => s.group)).size).toBe(16);
    const seen = new Set();
    for (const s of SEED_ASSETS) {
      for (const n of [s.nameKm, s.nameEn]) {
        const k = `${s.group}|${n.toLowerCase()}`;
        expect(seen.has(k)).toBe(false);
        seen.add(k);
      }
    }
  });

  it("can assemble a fish-market scene from one library", () => {
    seedAssets();
    const scene = pickForStory({ groups: ["people", "places", "animals", "vehicles", "farming"], limit: 100 })
      .map((i) => i.data.nameEn);
    for (const need of ["Fisher", "Fish market", "Fishing boat", "Fishing net", "Shrimp", "Harbor"]) {
      expect(scene).toContain(need);
    }
  });

  it("library batch discards everything when it throws, and persists once on success", () => {
    let threw = false;
    try { batch(() => { createItem({ group: "food", name: "x" }); throw new Error("boom"); }); } catch { threw = true; }
    expect(threw).toBe(true);
    expect(listItems()).toHaveLength(0);
    batch(() => { createItem({ group: "food", name: "a" }); createItem({ group: "food", name: "b" }); });
    expect(listItems()).toHaveLength(2);
  });

  it("seed has roads, racing, industry, luxury retail and sports, and every bank is fictional", () => {
    seedAssets();
    const names = searchAssets({}).map((i) => i.data.nameEn);
    for (const n of [
      "Highway", "Multi-level interchange", "Underground metro", "Elevated skytrain", "High-speed train",
      "Supertall skyscraper", "Race car", "Car racing circuit", "Football stadium", "Volleyball court",
      "Steel mill", "Sand quarry", "River sand", "Luxury watch boutique", "Diamond and jewelry salon",
      "Luxury perfume boutique", "Sneaker store", "360-degree camera",
    ]) expect(names).toContain(n);
    const banks = searchAssets({ tag: "bank" });
    expect(banks.length).toBeGreaterThanOrEqual(5);
    for (const b of banks) expect(b.tags).toContain("fictional");
  });

  it("countryside has separate dry-season and rainy-season looks", () => {
    seedAssets();
    expect(searchAssets({ tag: "dry-season" }).length).toBeGreaterThanOrEqual(2);
    expect(searchAssets({ tag: "rainy-season", group: "places" }).length).toBeGreaterThanOrEqual(2);
    const dry = searchAssets({ q: "Hills and grassland (dry season)" })[0];
    expect(dry.data.appearance).toContain("ស្ងួត");
  });

  it("a Cambodian story prefers the Khmer bank over the other cities' banks", () => {
    seedAssets();
    const b = pickForStory({ country: "KH", region: "asia", groups: ["buildings"], limit: 100 });
    expect(b[0].data.nameEn).toBe("Mekong Crown Private Bank");
    expect(b.some((i) => i.data.nameEn === "Hudson Vale Private Bank")).toBe(false);
  });

  it("at equal rank, the user's own assets come before AI-written seed items", () => {
    seedAssets();
    createAsset({ group: "buildings", nameKm: "ជណ្ដើរបេតុង", nameEn: "Concrete stairs", region: "asia", country: "KH", appearance: "ជណ្ដើរបេតុង" });
    const b = pickForStory({ country: "KH", region: "asia", groups: ["buildings"], limit: 100 });
    expect(b[0].data.nameEn).toBe("Concrete stairs");
    expect(b[0].source).toBe("user");
    expect(b.some((i) => i.data.nameEn === "Mekong Crown Private Bank")).toBe(true);
  });

  it("moto taxi (KH) ranks before generic vehicles in a Cambodian story", () => {
    seedAssets();
    const v = pickForStory({ country: "KH", region: "asia", groups: ["vehicles"], limit: 50 });
    expect(v[0].data.nameEn).toBe("Moto taxi");
  });
});
