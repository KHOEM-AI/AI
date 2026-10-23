import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ingestFile, loadDocs, hybridSearch, ragAnswer, cosine, buildContext } from "../rag.mjs";

const STORE = path.join(process.cwd(), "data", "rag", "docs.jsonl");
beforeAll(() => { fs.rmSync(path.dirname(STORE), { recursive: true, force: true }); fs.mkdirSync(path.dirname(STORE), { recursive: true }); });

describe("rag ingest", () => {
  it("ផ្តល់ docs ពី jsonl", () => {
    const f = "data/rag/test.jsonl";
    fs.writeFileSync(f, JSON.stringify({ text: "ទឹកត្រីស៊ុតស្វាយ គឺជាម្ហូបខ្មែរឆ្ងាញ់" }) + "\n");
    const r = ingestFile(f);
    expect(r.added).toBeGreaterThan(0);
    expect(loadDocs().length).toBeGreaterThan(0);
  });
  it("khmer keyword search រកឃើញ", async () => {
    const hits = await hybridSearch("ទឹកត្រីស៊ុតស្វាយ");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].text).toContain("ស៊ុតស្វាយ");
  });
  it("រកមិនឃើញ → found:false", async () => {
    const r = await ragAnswer("quantum chromodynamics in space", async () => "x");
    expect(r.found).toBe(false);
  });
  it("citation + context", async () => {
    const hits = await hybridSearch("ស៊ុតស្វាយ");
    expect(buildContext(hits)).toMatch(/\[.*#\d/);
  });
  it("cosine", () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });
});
