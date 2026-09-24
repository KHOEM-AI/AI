import { describe, it, expect } from "vitest";
import { detectLanguage, RE, SAY, LANGUAGE_REGISTRY } from "../languageRegistry.mjs";

describe("languageRegistry.mjs", () => {
  it("detects Khmer, English and Chinese", () => {
    expect(detectLanguage("សួស្តី")).toBe("km");
    expect(detectLanguage("hello there")).toBe("en");
    expect(detectLanguage("你好")).toBe("zh");
  });

  it("returns a string code for any input", () => {
    for (const s of ["", "123", "???", "/help"]) {
      expect(typeof detectLanguage(s)).toBe("string");
    }
  });

  it("RE has hello and name regexes for km and en", () => {
    for (const l of ["km", "en"]) {
      expect(RE[l].hello).toBeInstanceOf(RegExp);
      expect(RE[l].name).toBeInstanceOf(RegExp);
    }
  });

  it("SAY.km replies are functions taking an honorific", () => {
    expect(typeof SAY.km.hello("បង")).toBe("string");
    expect(typeof SAY.km.unknown("បង")).toBe("string");
  });

  it("SAY.en replies are plain strings", () => {
    expect(typeof SAY.en.hello).toBe("string");
    expect(typeof SAY.en.unknown).toBe("string");
  });

  it("LANGUAGE_REGISTRY contains expected language metadata", () => {
    expect(LANGUAGE_REGISTRY.km.status).toBe("active");
    expect(LANGUAGE_REGISTRY.km.module).toBe("./khmer.mjs");
    expect(LANGUAGE_REGISTRY.km.replyExport).toBe("khmerReply");
    expect(LANGUAGE_REGISTRY.en.status).toBe("active");
    expect(LANGUAGE_REGISTRY.en.module).toBe("./english.mjs");
    expect(LANGUAGE_REGISTRY.en.replyExport).toBe("englishReply");
    expect(LANGUAGE_REGISTRY.zh.status).toBe("active");
    expect(LANGUAGE_REGISTRY.zh.module).toBe("./chinese.mjs");
    expect(LANGUAGE_REGISTRY.zh.replyExport).toBe("chineseReply");
  });

  it("LANGUAGE_REGISTRY is frozen", () => {
    expect(Object.isFrozen(LANGUAGE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(LANGUAGE_REGISTRY.en)).toBe(true);
    expect(Object.isFrozen(LANGUAGE_REGISTRY.zh)).toBe(true);
    expect(Object.isFrozen(LANGUAGE_REGISTRY.km)).toBe(true);
  });
});
