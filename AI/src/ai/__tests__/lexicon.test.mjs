import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lookup, addTerm, answerKm, listDomains } from "../lexicon.mjs";
import { SEED_LEXICON } from "../lexiconSeed.mjs";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lex-"));
  process.env.LEXICON_FILE = path.join(dir, "lexicon.json");
});
afterEach(() => {
  delete process.env.LEXICON_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lexicon", () => {
  it("seed has no duplicate terms per domain and covers key domains", () => {
    const seen = new Set();
    for (const r of SEED_LEXICON) {
      expect(r.km && r.en && r.defKm).toBeTruthy();
      for (const t of [r.km, r.en]) {
        const k = `${r.domain}|${t.toLowerCase()}`;
        expect(seen.has(k)).toBe(false);
        seen.add(k);
      }
    }
    for (const d of ["hospital", "science", "country", "food"]) expect(listDomains()).toContain(d);
  });

  it("looks up by Khmer, English and domain", () => {
    expect(lookup({ q: "មន្ទីរពេទ្យ" })[0].en).toBe("Hospital");
    expect(lookup({ q: "cambodia" })[0].km).toBe("កម្ពុជា");
    expect(lookup({ domain: "country", limit: 100 }).length).toBeGreaterThanOrEqual(15);
  });

  it("adds user terms without duplicating, and user terms rank first", () => {
    expect(addTerm({ domain: "hospital", km: "ពេទ្យ", en: "Hospital" }).duplicate).toBe(true);
    expect(addTerm({ domain: "", km: "x" }).reason).toBe("empty_domain");
    expect(addTerm({ domain: "hospital" }).reason).toBe("empty_term");
    const r = addTerm({ domain: "hospital", km: "មន្ទីរពេទ្យឯកជន", en: "Private clinic", defKm: "គ្លីនិកឯកជន" });
    expect(r.duplicate).toBe(false);
    expect(lookup({ q: "ឯកជន" })[0].source).toBe("user");
  });

  it("answers honestly when a term is unknown", () => {
    expect(answerKm("អាម៉ុក").found).toBe(true);
    expect(answerKm("zzzz").found).toBe(false);
  });
});
