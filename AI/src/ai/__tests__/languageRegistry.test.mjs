import { describe, it, expect } from "vitest";
import { detectLanguage, RE, SAY } from "../languageRegistry.mjs";

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
});
