import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";

vi.mock("../khoemApi.mjs", () => ({
  khoemApiHealth: vi.fn(async () => ({ status: "ok" })),
  getKhoemLanguages: vi.fn(async () => ["km"]),
  getKhoemLocales: vi.fn(async () => ["km-KH"]),
  getKhoemCoverage: vi.fn(async () => ({ km: 1 })),
  searchKhoemKnowledge: vi.fn(async () => "ចម្លើយ"),
  searchKhoemKhmer: vi.fn(async () => null),
  khoemTranslate: vi.fn(async (l, k) => `${l}:${k}`),
}));

import { registerAllApis, API_MODULES } from "../registerAll.mjs";
import { registerKhoemBridgeApi } from "../khoemBridgeApi.mjs";
import * as khoem from "../khoemApi.mjs";

let server;
async function boot(modules) {
  const app = express();
  app.use(express.json());
  const result = registerAllApis(app, modules);
  await new Promise((r) => { server = app.listen(0, r); });
  return { base: `http://127.0.0.1:${server.address().port}`, result };
}
afterEach(() => new Promise((r) => (server ? server.close(r) : r())));

describe("registerAll", () => {
  it("បញ្ជី module មានឈ្មោះមិនស្ទួន ហើយមាន 6", () => {
    const names = API_MODULES.map((m) => m.name);
    expect(names.length).toBe(6);
    expect(new Set(names).size).toBe(6);
  });
  it("module មួយខូច មិនធ្វើឱ្យទាំងអស់ដួល ហើយ /api/registry រាយ", async () => {
    const { base } = await boot([
      { name: "good", register: () => {} },
      { name: "bad", register: () => { throw new Error("boom"); } },
    ]);
    const j = await (await fetch(`${base}/api/registry`)).json();
    expect(j.loaded).toEqual(["good"]);
    expect(j.failed[0]).toMatchObject({ name: "bad", error: "boom" });
  });
  it("khoem bridge: GET ជាប់ ហើយ translate ពិនិត្យ input", async () => {
    const { base } = await boot([{ name: "khoemBridge", register: registerKhoemBridgeApi }]);
    expect((await (await fetch(`${base}/api/khoem/languages`)).json()).data).toEqual(["km"]);
    expect((await (await fetch(`${base}/api/khoem/knowledge?q=a`)).json()).data).toBe("ចម្លើយ");
    const bad = await fetch(`${base}/api/khoem/translate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    expect(bad.status).toBe(400);
    const good = await fetch(`${base}/api/khoem/translate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "km", key: "hi" }),
    });
    expect((await good.json()).data).toBe("km:hi");
  });
  it("khoem bridge: KHOEM API ខាងក្រៅដួល -> 502", async () => {
    khoem.khoemApiHealth.mockRejectedValueOnce(new Error("down"));
    const { base } = await boot([{ name: "khoemBridge", register: registerKhoemBridgeApi }]);
    const r = await fetch(`${base}/api/khoem/health`);
    expect(r.status).toBe(502);
    expect((await r.json()).error).toBe("down");
  });
});
