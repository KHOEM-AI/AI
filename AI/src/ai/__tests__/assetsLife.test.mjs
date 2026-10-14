import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { seedAll, searchAssets, pickForStory, ALL_SEEDS } from "../assets.mjs";
import { SEED_LIFE } from "../assetsSeedLife.mjs";
import { GROUPS } from "../library.mjs";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "life-"));
  process.env.LIBRARY_FILE = path.join(dir, "library.json");
});
afterEach(() => {
  delete process.env.LIBRARY_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("assetsSeedLife", () => {
  it("has valid groups and no duplicate names across all seeds", () => {
    const seen = new Set();
    for (const s of ALL_SEEDS) {
      expect(GROUPS).toContain(s.group);
      for (const n of [s.nameKm, s.nameEn]) {
        const k = `${s.group}|${n.toLowerCase()}`;
        expect(seen.has(k)).toBe(false);
        seen.add(k);
      }
    }
    expect(SEED_LIFE.length).toBeGreaterThanOrEqual(61);
  });

  it("seedAll is idempotent and covers dining, fitness, nightlife and tools", () => {
    const a = seedAll();
    expect(a.failed).toBe(0);
    expect(a.added).toBe(ALL_SEEDS.length);
    expect(seedAll().added).toBe(0);
    const names = searchAssets({}).map((i) => i.data.nameEn);
    for (const n of ["Fine dining restaurant", "Simple rice eatery", "Modern fitness club", "Neighborhood gym",
      "KTV club", "Nightclub", "Bodyguard", "Laser stage lights", "Hammer"]) expect(names).toContain(n);
  });

  it("nightlife venues are tagged adult-only and excluded when alcohol:false", () => {
    seedAll();
    expect(searchAssets({ tag: "nightlife" }).length).toBeGreaterThanOrEqual(5);
    const kids = pickForStory({ groups: ["places", "drinks"], alcohol: false, limit: 100 });
    expect(kids.some((i) => i.tags.includes("adult-only") || i.data.alcohol)).toBe(false);
    expect(kids.some((i) => i.data.nameEn === "Family restaurant")).toBe(true);
  });
});
