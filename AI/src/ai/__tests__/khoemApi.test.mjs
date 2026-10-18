import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchKhoemKnowledge, searchKhoemKhmer, khoemTranslate, khoemApiHealth,
} from "../khoemApi.mjs";

const ok = (data) => ({ ok: true, status: 200, json: async () => ({ data }) });

describe("khoemApi", () => {
  let f;
  beforeEach(() => { f = vi.fn(); vi.stubGlobal("fetch", f); });
  afterEach(() => vi.unstubAllGlobals());

  it("knowledge: found -> answer", async () => {
    f.mockResolvedValue(ok({ found: true, answer: "ចម្លើយ" }));
    expect(await searchKhoemKnowledge("សួស្តី")).toBe("ចម្លើយ");
    expect(f.mock.calls[0][0]).toContain("/api/knowledge?q=");
  });
  it("knowledge: exact បន្ថែម &exact=1", async () => {
    f.mockResolvedValue(ok({ found: false }));
    expect(await searchKhoemKnowledge("a", { exact: true })).toBeNull();
    expect(f.mock.calls[0][0]).toContain("&exact=1");
  });
  it("query ទទេ ឬវែងពេល -> null មិនហៅ fetch", async () => {
    expect(await searchKhoemKnowledge("  ")).toBeNull();
    expect(await searchKhoemKhmer("x".repeat(201))).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it("khmer: ប្រើ exact=1", async () => {
    f.mockResolvedValue(ok({ found: true, answer: "ខ្មែរ" }));
    expect(await searchKhoemKhmer("ក")).toBe("ខ្មែរ");
    expect(f.mock.calls[0][0]).toContain("/api/khmer?q=");
    expect(f.mock.calls[0][0]).toContain("exact=1");
  });
  it("translate: POST body ត្រឹមត្រូវ", async () => {
    f.mockResolvedValue(ok("បកប្រែ"));
    await khoemTranslate("km", "hello", { n: 1 });
    const [, opt] = f.mock.calls[0];
    expect(opt.method).toBe("POST");
    expect(JSON.parse(opt.body)).toEqual({ locale: "km", key: "hello", params: { n: 1 } });
  });
  it("error -> throw សារពី server", async () => {
    f.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: { message: "ខូច" } }) });
    await expect(khoemApiHealth()).rejects.toThrow("ខូច");
  });
  it("error គ្មាន body -> សារលំនាំដើម", async () => {
    f.mockResolvedValue({ ok: false, status: 503, json: async () => { throw new Error("x"); } });
    await expect(khoemApiHealth()).rejects.toThrow("503");
  });
});
