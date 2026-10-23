import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ingestFile, loadDocs, hybridSearch, ragAnswer, cosine, buildContext } from "../rag.mjs";

const STORE = path.join(process.cwd(), "data", "rag", "docs.jsonl");
const BAK = path.join(process.cwd(), "data", "rag.testbak");
beforeAll(() => {
  const d = path.dirname(STORE);
  fs.rmSync(BAK, { recursive: true, force: true });
  if (fs.existsSync(d)) fs.cpSync(d, BAK, { recursive: true });
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
});
afterAll(() => {
  const d = path.dirname(STORE);
  fs.rmSync(d, { recursive: true, force: true });
  if (fs.existsSync(BAK)) {
    fs.cpSync(BAK, d, { recursive: true });
    fs.rmSync(BAK, { recursive: true, force: true });
  }
});

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
