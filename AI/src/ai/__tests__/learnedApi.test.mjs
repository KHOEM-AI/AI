import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = {
  "សួស្តី": "ជម្រាបសួរ",
  "សួស្ដី": "ជម្រាបសួរ",
  "ឈ្មោះអ្វី": "ខ្ញុំគឺ KHOEM",
  "ទៅផ្សារ": "ទិញបន្លែ",
  "ផ្ទះ": "ទីជម្រក",
};
const pass = (_q, _s, n) => n();
let server, base, tmp, routes, L, realHome;

const call = async (method, p, body) => {
  const r = await fetch(base + p, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};
const get = (p) => call("GET", p);
const post = (p, b) => call("POST", p, b ?? {});
const file = () => JSON.parse(fs.readFileSync(L.FILE, "utf8"));
const enc = encodeURIComponent;

beforeAll(async () => {
  realHome = process.env.HOME;
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "khoem-learnedapi-"));
  process.env.HOME = tmp;
  L = await import("../learn.mjs");
  // ការពារទិន្នន័យពិត: បើ FILE មិននៅក្នុង tmp ត្រូវបញ្ឈប់ភ្លាម
  if (!L.FILE.startsWith(tmp)) throw new Error("FILE មិននៅក្នុង tmp: " + L.FILE);
  const { default: express } = await import("express");
  const { registerLearnedApi } = await import("../learnedApi.mjs");
  const app = express();
  app.use(express.json());
  routes = registerLearnedApi(app, { guard: pass, policy: () => pass });
  await new Promise((r) => { server = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  if (realHome === undefined) delete process.env.HOME; else process.env.HOME = realHome;
  fs.rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(L.BACKUP_DIR, { recursive: true, force: true });
  fs.writeFileSync(L.FILE, JSON.stringify(BASE));
});

describe("learnedApi", () => {
  it("មាន 30 route មិនស្ទួន", () => {
    expect(routes.length).toBe(30);
    expect(new Set(routes).size).toBe(30);
  });

  it("អាន: count/stats/get/exists/match", async () => {
    expect((await get("/api/learned/count")).body.result.count).toBe(5);
    const st = (await get("/api/learned/stats")).body.result;
    expect(st.count).toBe(5);
    expect(st.longestAnswer).toBeTruthy();
    expect((await get("/api/learned/get?q=" + enc("ផ្ទះ"))).body.result.a).toBe("ទីជម្រក");
    expect((await get("/api/learned/get?q=" + enc(" ផ្ទះ? "))).status).toBe(200);
    expect((await get("/api/learned/get?q=" + enc("មិនមាន"))).status).toBe(404);
    expect((await get("/api/learned/get")).status).toBe(400);
    expect((await get("/api/learned/exists?q=" + enc("ផ្ទះ"))).body.result.exists).toBe(true);
    expect((await get("/api/learned/exists?q=" + enc("គ្មាន"))).body.result.exists).toBe(false);
    expect((await get("/api/learned/match?q=" + enc("ផ្ទះ"))).body.result.confidence).toBe("HIGH");
  });

  it("អាន: search/starts/similar/page/keys/longest/shortest/random/duplicates", async () => {
    expect((await get("/api/learned/search?q=" + enc("ផ្សារ"))).body.result.total).toBe(1);
    expect((await get("/api/learned/starts?prefix=" + enc("សួស្"))).body.result.total).toBe(2);
    expect((await get("/api/learned/similar?q=" + enc("សួស្តីបង"))).body.result.items.length).toBeGreaterThan(0);
    const pg = (await get("/api/learned/page?limit=2&sort=alpha")).body.result;
    expect(pg.total).toBe(5);
    expect(pg.items.length).toBe(2);
    expect((await get("/api/learned/keys?limit=3")).body.result.items.length).toBe(3);
    const lo = (await get("/api/learned/longest?limit=1")).body.result.items[0];
    const sh = (await get("/api/learned/shortest?limit=1")).body.result.items[0];
    expect(lo.len).toBeGreaterThanOrEqual(sh.len);
    expect(Object.keys(BASE)).toContain((await get("/api/learned/random")).body.result.q);
    const dup = (await get("/api/learned/duplicates")).body.result;
    expect(dup.groups).toBe(1);
    expect(dup.items[0].questions.length).toBe(2);
  });

  it("validate និង clean (ត្រូវការ confirm)", async () => {
    fs.writeFileSync(L.FILE, JSON.stringify({ ok: "yes", "/bad": "x", empty: "  ", "ទទេ": "" }));
    const v = (await get("/api/learned/validate")).body.result;
    expect(v.total).toBe(4);
    expect(v.hard).toBe(3);
    const pre = (await post("/api/learned/clean")).body.result;
    expect(pre.confirmed).toBe(false);
    expect(pre.matches).toBe(3);
    expect(Object.keys(file()).length).toBe(4);
    const done = (await post("/api/learned/clean", { confirm: true })).body.result;
    expect(done.removed).toBe(3);
    expect(Object.keys(file())).toEqual(["ok"]);
  });

  it("សរសេរ: bulk/update/rename/append", async () => {
    const b = (await post("/api/learned/bulk", {
      items: [{ q: "ក", a: "១" }, { q: "ខ", a: "២" }, { q: "x=y", a: "bad" }, { q: "គ", a: "" }],
    })).body.result;
    expect(b.added).toBe(2);
    expect(b.skipped.length).toBe(2);
    expect(Object.keys(file()).length).toBe(7);
    expect((await post("/api/learned/bulk", { items: Array.from({ length: 201 }, (_, i) => ({ q: "q" + i, a: "a" })) })).status).toBe(400);
    expect((await post("/api/learned/update", { q: "មិនមាន", a: "x" })).status).toBe(404);
    expect((await post("/api/learned/update", { q: "ក", a: "៣" })).status).toBe(200);
    expect(file()["ក"]).toBe("៣");
    expect((await post("/api/learned/rename", { from: "ក", to: "ក២" })).status).toBe(200);
    expect(file()["ក២"]).toBe("៣");
    expect((await post("/api/learned/rename", { from: "ក២", to: "ខ" })).status).toBe(409);
    expect((await post("/api/learned/rename", { from: "ក២", to: "ខ", overwrite: true })).status).toBe(200);
    expect(file()["ខ"]).toBe("៣");
    expect((await post("/api/learned/append", { q: "ផ្ទះ", a: "បន្ថែម" })).status).toBe(200);
    expect(file()["ផ្ទះ"]).toContain("\nបន្ថែម");
  });

  it("import: skip និង merge", async () => {
    const s = (await post("/api/learned/import", { mode: "skip", data: { "ផ្ទះ": "ថ្មី", "ថ្មី": "១" } })).body.result;
    expect(s.kept).toBe(1);
    expect(s.added).toBe(1);
    expect(file()["ផ្ទះ"]).toBe("ទីជម្រក");
    const m = (await post("/api/learned/import", { data: { "ផ្ទះ": "ថ្មី" } })).body.result;
    expect(m.updated).toBe(1);
    expect(file()["ផ្ទះ"]).toBe("ថ្មី");
    expect((await post("/api/learned/import", { data: [1, 2] })).status).toBe(400);
  });

  it("forget-bulk និង forget-prefix (ត្រូវការ confirm)", async () => {
    const f = (await post("/api/learned/forget-bulk", { qs: ["ផ្ទះ", "មិនមាន"] })).body.result;
    expect(f.removed).toBe(1);
    expect(f.missing.length).toBe(1);
    expect((await post("/api/learned/forget-prefix", { prefix: "ស" })).status).toBe(400);
    const pre = (await post("/api/learned/forget-prefix", { prefix: "សួស្" })).body.result;
    expect(pre.confirmed).toBe(false);
    expect(pre.matches).toBe(2);
    expect(Object.keys(file()).length).toBe(4);
    const done = (await post("/api/learned/forget-prefix", { prefix: "សួស្", confirm: true })).body.result;
    expect(done.removed).toBe(2);
  });

  it("backup និង restore (ត្រូវការ confirm, ការពារ path)", async () => {
    const name = (await post("/api/learned/backup")).body.result.name;
    expect((await get("/api/learned/backups")).body.result.map((x) => x.name)).toContain(name);
    await post("/api/learned/bulk", { items: [{ q: "ថ្មី", a: "១" }] });
    expect(Object.keys(file()).length).toBe(6);
    expect((await post("/api/learned/restore", { name: "../x.json" })).status).toBe(400);
    expect((await post("/api/learned/restore", { name: "learned-មិនមាន.json" })).status).toBe(400);
    const pre = (await post("/api/learned/restore", { name })).body.result;
    expect(pre.confirmed).toBe(false);
    expect(Object.keys(file()).length).toBe(6);
    expect((await post("/api/learned/restore", { name, confirm: true })).status).toBe(200);
    expect(file()).toEqual(BASE);
  });

  it("clear ត្រូវការ confirm \"CLEAR\" ហើយមាន backup", async () => {
    expect((await post("/api/learned/clear")).status).toBe(400);
    expect((await post("/api/learned/clear", { confirm: true })).status).toBe(400);
    expect(Object.keys(file()).length).toBe(5);
    expect((await post("/api/learned/clear", { confirm: "CLEAR" })).body.result.cleared).toBe(5);
    expect(file()).toEqual({});
    expect((await get("/api/learned/backups")).body.result.length).toBeGreaterThan(0);
  });

  it("export, export.txt, health", async () => {
    expect((await get("/api/learned/export")).body.result).toEqual(BASE);
    const t = (await get("/api/learned/export.txt")).body;
    expect(t).toContain("ផ្ទះ = ទីជម្រក");
    const h = (await get("/api/learned/health")).body.result;
    expect(h.parseOk).toBe(true);
    expect(h.count).toBe(5);
  });
});
