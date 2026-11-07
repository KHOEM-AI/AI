import { describe, it, expect } from "vitest";
import { validateInput, makeLimiter, translateWithAi, registerTranslateApi, MAX_CHARS } from "../translateApi.mjs";

function fakeRes() {
  const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } };
  return r;
}
function okFetch(text, capture) {
  return async (url, init) => {
    if (capture) capture.body = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text }], usage: { input_tokens: 5, output_tokens: 3 } }) };
  };
}
function mkHandler(deps) {
  const app = { handlers: {}, post(path, h) { app.handlers[path] = h; } };
  registerTranslateApi(app, deps);
  return app.handlers["/api/ai-translate"];
}

describe("translateApi — input validation", () => {
  it("rejects empty text, too long text and bad language", () => {
    expect(validateInput({ text: "  ", to: "km" }).ok).toBe(false);
    expect(validateInput({ text: "a".repeat(MAX_CHARS + 1), to: "km" }).ok).toBe(false);
    expect(validateInput({ text: "hi", to: "fr" }).ok).toBe(false);
    expect(validateInput({ text: "hi", to: "__proto__" }).ok).toBe(false);
    expect(validateInput(undefined).ok).toBe(false);
  });
  it("accepts and trims valid input", () => {
    expect(validateInput({ text: "  hello ", to: "zh" })).toEqual({ ok: true, text: "hello", to: "zh" });
  });
});

describe("translateApi — rate limiter", () => {
  it("limits per minute and per day", () => {
    let t = 0;
    const take = makeLimiter({ perMinute: 2, perDay: 3, now: () => t });
    expect(take().ok).toBe(true);
    expect(take().ok).toBe(true);
    expect(take()).toEqual({ ok: false, reason: "per_minute" });
    t = 61000;
    expect(take().ok).toBe(true);
    t = 122000;
    expect(take()).toEqual({ ok: false, reason: "per_day" });
  });
});

describe("translateApi — translateWithAi (mock fetch)", () => {
  it("returns the translation and asks for the right language", async () => {
    const cap = {};
    const r = await translateWithAi({ text: "Hello", to: "km" }, { apiKey: "k", fetchImpl: okFetch("សួស្ដី", cap) });
    expect(r.text).toBe("សួស្ដី");
    expect(cap.body.system).toContain("Khmer");
    expect(cap.body.messages[0].content).toBe("Hello");
  });
  it("throws 503 without a key", async () => {
    await expect(translateWithAi({ text: "Hello", to: "km" }, { apiKey: "" })).rejects.toMatchObject({ status: 503 });
  });
  it("maps upstream errors (502, and 429 stays 429)", async () => {
    const bad = (status) => async () => ({ ok: false, status, json: async () => ({ error: { message: "nope" } }) });
    await expect(translateWithAi({ text: "x", to: "en" }, { apiKey: "k", fetchImpl: bad(401) })).rejects.toMatchObject({ status: 502 });
    await expect(translateWithAi({ text: "x", to: "en" }, { apiKey: "k", fetchImpl: bad(429) })).rejects.toMatchObject({ status: 429 });
  });
  it("throws when the answer has no text", async () => {
    const empty = async () => ({ ok: true, status: 200, json: async () => ({ content: [] }) });
    await expect(translateWithAi({ text: "x", to: "en" }, { apiKey: "k", fetchImpl: empty })).rejects.toMatchObject({ status: 502 });
  });
  it("refuses a cut-off answer (stop_reason max_tokens)", async () => {
    const cut = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "part" }], stop_reason: "max_tokens" }) });
    await expect(translateWithAi({ text: "x", to: "en" }, { apiKey: "k", fetchImpl: cut })).rejects.toMatchObject({ status: 502 });
  });
});

describe("translateApi — route", () => {
  it("answers 200 with the translation", async () => {
    const h = mkHandler({ apiKey: "sk-test-secret", fetchImpl: okFetch("Hello"), limiter: makeLimiter() });
    const res = fakeRes();
    await h({ body: { text: "សួស្ដី", to: "en" } }, res);
    expect(res.code).toBe(200);
    expect(res.body.data.text).toBe("Hello");
  });
  it("answers 400 for bad input, 503 without key, 429 over the limit", async () => {
    const r1 = fakeRes();
    await mkHandler({ apiKey: "sk-test-secret", fetchImpl: okFetch("x") })({ body: { text: "", to: "km" } }, r1);
    expect(r1.code).toBe(400);
    const r2 = fakeRes();
    await mkHandler({ apiKey: "", fetchImpl: okFetch("x") })({ body: { text: "hi", to: "km" } }, r2);
    expect(r2.code).toBe(503);
    const r3 = fakeRes();
    await mkHandler({ apiKey: "sk-test-secret", fetchImpl: okFetch("x"), limiter: () => ({ ok: false, reason: "per_minute" }) })({ body: { text: "hi", to: "km" } }, r3);
    expect(r3.code).toBe(429);
  });
  it("never leaks the key in an error response", async () => {
    const bad = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "invalid x-api-key" } }) });
    const res = fakeRes();
    await mkHandler({ apiKey: "sk-test-secret", fetchImpl: bad, limiter: makeLimiter() })({ body: { text: "hi", to: "km" } }, res);
    expect(res.code).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain("sk-test-secret");
  });
});
