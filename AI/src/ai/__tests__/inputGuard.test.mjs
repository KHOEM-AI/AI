import { describe, it, expect } from "vitest";
import { validateRequest, inputGuardMiddleware, LIMITS } from "../inputGuard.mjs";

const rq = (body, extra = {}) => ({
  get: (h) => (extra.headers || {})[h.toLowerCase()],
  query: extra.query || {},
  body,
});

describe("inputGuard.mjs", () => {
  it("accepts normal input, Khmer with zero-width space, tabs and newlines", () => {
    expect(validateRequest(rq({ text: "សួស្តី\u200Bបង\n\tok" })).ok).toBe(true);
  });
  it("rejects control characters and bidi overrides", () => {
    expect(validateRequest(rq({ text: "a\u0000b" })).code).toBe("BAD_CHAR");
    expect(validateRequest(rq({ newContent: "x\u202Ey" })).code).toBe("BAD_CHAR");
  });
  it("rejects text over the limit, but allows long newContent", () => {
    expect(validateRequest(rq({ text: "x".repeat(LIMITS.text + 1) })).code).toBe("TOO_LONG");
    expect(validateRequest(rq({ newContent: "x".repeat(LIMITS.text + 1) })).ok).toBe(true);
    expect(validateRequest(rq({ newContent: "x".repeat(LIMITS.newContent + 1) })).code).toBe("TOO_LONG");
  });
  it("checks nested messages and reports the field path", () => {
    const r = validateRequest(rq({ messages: [{ content: "ok" }, { content: "a\u0007" }] }));
    expect(r.ok).toBe(false);
    expect(r.field).toBe("messages[1].content");
  });
  it("validates actor and decidedBy as identifiers", () => {
    expect(validateRequest(rq({ decidedBy: "control-center" })).ok).toBe(true);
    expect(validateRequest(rq({ actor: "human:bob" })).ok).toBe(true);
    expect(validateRequest(rq({ actor: "ឈ្មោះ" })).ok).toBe(true);
    expect(validateRequest(rq({ actor: "bad actor!" })).code).toBe("BAD_ID");
    expect(validateRequest(rq({ actor: "x".repeat(65) })).code).toBe("BAD_ID");
  });
  it("validates the x-actor header and query values", () => {
    expect(validateRequest(rq({}, { headers: { "x-actor": "alice" } })).ok).toBe(true);
    expect(validateRequest(rq({}, { headers: { "x-actor": "a<b>" } })).code).toBe("BAD_ID");
    expect(validateRequest(rq({}, { query: { q: "x".repeat(LIMITS.query + 1) } })).code).toBe("TOO_LONG");
  });
  it("limits depth and array size", () => {
    let deep = { v: "x" };
    for (let i = 0; i < 12; i++) deep = { a: deep };
    expect(validateRequest(rq(deep)).code).toBe("TOO_DEEP");
    expect(validateRequest(rq({ list: new Array(LIMITS.items + 1).fill(1) })).code).toBe("TOO_MANY");
  });
  it("middleware answers 400 INVALID_INPUT and never calls next", () => {
    let nextCalled = false, status = 0, body = null;
    const res = { status(c) { status = c; return this; }, json(o) { body = o; return this; } };
    inputGuardMiddleware(rq({ text: "a\u0000" }), res, () => { nextCalled = true; });
    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_INPUT");
    expect(nextCalled).toBe(false);
  });
});
