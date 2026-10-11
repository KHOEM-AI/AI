import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAsset, searchAssets, pickForStory, seedAssets } from "../assets.mjs";
import { SEED_ASSETS } from "../assetsSeed.mjs";
import { GROUPS } from "../library.mjs";

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
});
