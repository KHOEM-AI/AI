import { describe, expect, it } from "vitest";
import {
  createKhmerGenerator,
  defaultTokenizer,
} from "../khmer.generator.mjs";

describe("Khmer generator", () => {
  it("tokenizes text without losing punctuation", () => {
    expect(defaultTokenizer("សួស្តី បង។")).toEqual([
      "សួស្តី", "បង", "។",
    ]);
  });

  it("learns from a corpus", () => {
    const generator = createKhmerGenerator({ order: 1 });
    const stats = generator.train([
      "ខ្ញុំ រៀន ភាសាខ្មែរ។",
      "ខ្ញុំ សរសេរ កូដ។",
    ]);

    expect(stats.trainedSentences).toBe(2);
    expect(stats.contexts).toBeGreaterThan(0);
  });

  it("can generate deterministically with a supplied random function", () => {
    const generator = createKhmerGenerator({ order: 1, maxTokens: 10 });
    generator.train(["ខ្ញុំ រៀន ភាសាខ្មែរ។"]);

    const output = generator.generate({ random: () => 0 });

    expect(output).toContain("ខ្ញុំ");
    expect(output.length).toBeGreaterThan(0);
  });

  it("returns an empty string before training", () => {
    expect(createKhmerGenerator().generate()).toBe("");
  });

  it("supports a seed", () => {
    const generator = createKhmerGenerator({ order: 1 });
    generator.train(["ខ្ញុំ រៀន ភាសាខ្មែរ។"]);

    expect(generator.generate({
      seed: "ខ្ញុំ",
      random: () => 0,
    })).toMatch(/^ខ្ញុំ/);
  });

  it("rejects an invalid order", () => {
    expect(() => createKhmerGenerator({ order: 0 })).toThrow(
      "order must be a positive integer",
    );
  });
});
