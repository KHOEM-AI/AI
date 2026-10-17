import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const KEYS = ["VITEST", "KHOEM_PERSIST", "KHOEM_DATA_DIR"];
const saved = {};
let dir;

// persist.mjs reads env at import time, so set env first, then import a fresh copy.
async function loadFresh({ vitest = false, persist, dataDir } = {}) {
  vi.resetModules();
  if (vitest) process.env.VITEST = "true"; else delete process.env.VITEST;
  if (persist === undefined) delete process.env.KHOEM_PERSIST; else process.env.KHOEM_PERSIST = persist;
  process.env.KHOEM_DATA_DIR = dataDir ?? dir;
  return import("../persist.mjs");
}

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "khoem-persist-"));
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
  }
  fs.rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("persist.mjs — disabled modes", () => {
  it("under Vitest: save writes nothing, load returns []", async () => {
    const p = await loadFresh({ vitest: true });
    p.saveItems("x", [{ a: 1 }]);
    expect(fs.readdirSync(dir)).toEqual([]);
    expect(p.loadItems("x")).toEqual([]);
  });
  it("KHOEM_PERSIST=0 disables persistence", async () => {
    const p = await loadFresh({ persist: "0" });
    p.saveItems("x", [{ a: 1 }]);
    expect(fs.readdirSync(dir)).toEqual([]);
    expect(p.loadItems("x")).toEqual([]);
  });
});

describe("persist.mjs — enabled", () => {
  it("round-trips items and writes {version, items}", async () => {
    const p = await loadFresh();
    const items = [{ id: "a", n: 1 }, { id: "b", n: 2 }];
    p.saveItems("things", items);
    expect(p.loadItems("things")).toEqual(items);
    const raw = JSON.parse(fs.readFileSync(path.join(dir, "things.json"), "utf8"));
    expect(raw.version).toBe(1);
    expect(raw.items).toEqual(items);
  });
  it("is atomic: no .tmp file is left behind", async () => {
    const p = await loadFresh();
    p.saveItems("things", [1]);
    expect(fs.readdirSync(dir)).toEqual(["things.json"]);
  });
  it("last save wins (overwrite)", async () => {
    const p = await loadFresh();
    p.saveItems("things", [{ v: 1 }]);
    p.saveItems("things", [{ v: 2 }, { v: 3 }]);
    expect(p.loadItems("things")).toEqual([{ v: 2 }, { v: 3 }]);
  });
  it("creates the data directory (including nested) when missing", async () => {
    const nested = path.join(dir, "a", "b");
    const p = await loadFresh({ dataDir: nested });
    p.saveItems("things", [1]);
    expect(fs.existsSync(path.join(nested, "things.json"))).toBe(true);
  });
  it("keeps names separate", async () => {
    const p = await loadFresh();
    p.saveItems("one", [1]);
    p.saveItems("two", [2]);
    expect(p.loadItems("one")).toEqual([1]);
    expect(p.loadItems("two")).toEqual([2]);
  });
  it("a fresh module instance loads what a previous one saved (restart)", async () => {
    const p1 = await loadFresh();
    p1.saveItems("things", [{ id: "keep" }]);
    const p2 = await loadFresh();
    expect(p2.loadItems("things")).toEqual([{ id: "keep" }]);
  });
});

describe("persist.mjs — bad input and failures", () => {
  it("missing file -> []", async () => {
    const p = await loadFresh();
    expect(p.loadItems("nope")).toEqual([]);
  });
  it("corrupt JSON -> [] (does not throw)", async () => {
    const p = await loadFresh();
    fs.writeFileSync(path.join(dir, "bad.json"), "{not json");
    expect(p.loadItems("bad")).toEqual([]);
  });
  it("items is not an array -> []", async () => {
    const p = await loadFresh();
    fs.writeFileSync(path.join(dir, "odd.json"), JSON.stringify({ version: 1, items: "nope" }));
    expect(p.loadItems("odd")).toEqual([]);
  });
  it("bare array without wrapper -> []", async () => {
    const p = await loadFresh();
    fs.writeFileSync(path.join(dir, "bare.json"), JSON.stringify([1, 2]));
    expect(p.loadItems("bare")).toEqual([]);
  });
  it("write failure is logged, not thrown", async () => {
    const blocker = path.join(dir, "file.txt");
    fs.writeFileSync(blocker, "x");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const p = await loadFresh({ dataDir: path.join(blocker, "sub") });
    expect(() => p.saveItems("things", [1])).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});
