import { describe, it, expect, vi } from "vitest";

describe("languageCenter.mjs", () => {
  it("routes English input to englishReply", async () => {
    vi.resetModules();

    const { routeLanguage } = await import("../languageCenter.mjs");

    const result = await routeLanguage("hello");

    expect(typeof result).toBe("string");
    expect(result).toBe("Hello! 🙂 Do you have any question or problem? You can ask me.");
  });

  it("routes Chinese input to chineseReply", async () => {
    vi.resetModules();

    const { routeLanguage } = await import("../languageCenter.mjs");

    const result = await routeLanguage("你好");

    expect(typeof result).toBe("string");
  });

  it("returns null for empty input", async () => {
    vi.resetModules();

    const { routeLanguage } = await import("../languageCenter.mjs");

    expect(await routeLanguage("")).toBeNull();
    expect(await routeLanguage("   ")).toBeNull();
  });

  it("reports supported languages", async () => {
    vi.resetModules();

    const {
      isLanguageSupported,
      listSupportedLanguages,
    } = await import("../languageCenter.mjs");

    expect(isLanguageSupported("en")).toBe(true);
    expect(isLanguageSupported("zh")).toBe(true);
    expect(isLanguageSupported("km")).toBe(true);

    expect(listSupportedLanguages()).toEqual(["km", "en", "zh"]);
  });

  it("returns null for a detected language without a registry entry", async () => {
    vi.resetModules();
    vi.doMock("../languageRegistry.mjs", () => ({
      detectLanguage: () => "xx",
      LANGUAGE_REGISTRY: {},
    }));

    const { routeLanguage } = await import("../languageCenter.mjs");
    expect(await routeLanguage("unknown")).toBeNull();

    vi.doUnmock("../languageRegistry.mjs");
  });

  it("returns null for a registry-only language", async () => {
    vi.resetModules();
    vi.doMock("../languageRegistry.mjs", () => ({
      detectLanguage: () => "km",
      LANGUAGE_REGISTRY: {
        km: {
          module: null,
          replyExport: null,
          status: "registry-only",
        },
      },
    }));

    const { routeLanguage } = await import("../languageCenter.mjs");
    expect(await routeLanguage("សួស្តី")).toBeNull();

    vi.doUnmock("../languageRegistry.mjs");
  });

  it("does not mutate the supported-language list", async () => {
    vi.resetModules();

    const { listSupportedLanguages } = await import("../languageCenter.mjs");

    const languages = listSupportedLanguages();

    expect(() => languages.push("km")).toThrow();
    expect(listSupportedLanguages()).toEqual(["km", "en", "zh"]);
  });
});
