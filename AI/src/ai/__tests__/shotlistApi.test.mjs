import { describe, it, expect, vi } from "vitest";

vi.mock("../api.mjs", () => ({ guard: () => {}, policy: (k) => ({ policy: k }) }));
vi.mock("../characters.mjs", () => ({
  listCharacters: () => [{ id: "c1", name: "Sok" }],
  buildPrompt: (id) => "prompt-" + id,
}));
vi.mock("../assets.mjs", () => ({ searchAssets: () => [{ id: "a1", nameEn: "market" }] }));

import { registerShotlistApi, shotlistHandler } from "../shotlistApi.mjs";

const mkRes = () => ({ code: 200, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } });

describe("shotlistApi", () => {
  it("registers POST /api/shotlist behind guard and both policies", () => {
    const routes = [];
    registerShotlistApi({ post: (p, ...h) => routes.push({ p, h }) });
    expect(routes).toHaveLength(1);
    expect(routes[0].p).toBe("/api/shotlist");
    expect(routes[0].h).toHaveLength(4);
    expect(routes[0].h[1]).toEqual({ policy: "characters.read" });
    expect(routes[0].h[2]).toEqual({ policy: "assets.read" });
  });
  it("builds a shot list from text with character, asset and voice", () => {
    const res = mkRes();
    shotlistHandler({ body: { text: "Sok walks to the market. Night falls.", voices: { c1: "voiceA" } } }, res);
    expect(res.code).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.shots[0].characters[0]).toMatchObject({ id: "c1", name: "Sok", prompt: "prompt-c1", voice: "voiceA" });
    expect(res.body.shots[0].asset).toMatchObject({ id: "a1" });
  });
  it("returns 400 when there are no beats", () => {
    const res = mkRes();
    shotlistHandler({ body: {} }, res);
    expect(res.code).toBe(400);
  });
  it("returns 413 when input is too long", () => {
    const res = mkRes();
    shotlistHandler({ body: { beats: ["x".repeat(20001)] } }, res);
    expect(res.code).toBe(413);
  });
  it("ignores non-object voices", () => {
    const res = mkRes();
    shotlistHandler({ body: { beats: ["Sok runs"], voices: ["bad"] } }, res);
    expect(res.code).toBe(200);
    expect(res.body.shots[0].characters[0].voice).toBeNull();
  });
});
