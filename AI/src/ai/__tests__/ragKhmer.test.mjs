import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let tmp, cwd0, hybridSearch;
const DOCS = [
  "រាជធានីរបស់ប្រទេសកម្ពុជាគឺភ្នំពេញ។",
  "កម្ពុជាមានព្រំដែនជាប់ប្រទេសថៃ ឡាវ និងវៀតណាម។",
  "ប្រាសាទអង្គរវត្តសាងសង់នៅសតវត្សទី១២។",
  "អក្ខរក្រមខ្មែរមានព្យញ្ជនៈ ៣៣ តួ។",
  "ទឹកត្រីស៊ុតស្វាយ គឺជាម្ហូបខ្មែរឆ្ងាញ់។",
];
const CASES = [
  ["រាជធានីរបស់កម្ពុជាគឺអ្វី", "ភ្នំពេញ"],
  ["កម្ពុជាមានព្រំដែនជាប់ប្រទេសអ្វីខ្លះ", "វៀតណាម"],
  ["អង្គរវត្តសាងសង់ពេលណា", "សតវត្សទី១២"],
  ["ភាសាខ្មែរមានព្យញ្ជនៈប៉ុន្មាន", "៣៣"],
  ["ទឹកត្រីស៊ុតស្វាយជាអ្វី", "ម្ហូប"],
];

beforeAll(async () => {
  cwd0 = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "khoem-rag-"));
  fs.mkdirSync(path.join(tmp, "data", "rag"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, "data", "rag", "docs.jsonl"),
    DOCS.map((text, i) => JSON.stringify({ id: "t#" + i, file: "t", text })).join("\n") + "\n",
  );
  const src = path.join(cwd0, "src/ai/rag.mjs");
  process.chdir(tmp);
  ({ hybridSearch } = await import(src + "?tmp=" + Date.now()));
});
afterAll(() => { process.chdir(cwd0); fs.rmSync(tmp, { recursive: true, force: true }); });

describe("rag: សំណួរខ្មែរពិត (ឃ្លាំងបណ្ដោះអាសន្ន)", () => {
  for (const [q, must] of CASES) {
    it("«" + q + "» → មាន " + must, async () => {
      const h = await hybridSearch(q, { topK: 1 });
      expect(h.length).toBe(1);
      expect(h[0].text).toContain(must);
    });
  }
  it("សំណួរក្រៅប្រធានបទ → គ្មានលទ្ធផល", async () => {
    expect((await hybridSearch("quantum chromodynamics in space")).length).toBe(0);
  });
});
