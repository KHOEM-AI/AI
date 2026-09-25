import { describe, it, expect } from "vitest";
import { khmerReply } from "../khmer.mjs";

describe("khmer.mjs", () => {
  it("replies to Khmer hello", () => {
    const result = khmerReply("សួស្តី");

    expect(result).toBe("សួស្តី! 🙂 មានអ្វីអាចជួយបានទេ?");
  });

  it("replies to Khmer name questions", () => {
    const result = khmerReply("អ្នកឈ្មោះអ្វី?");

    expect(result).toBe("ខ្ញុំឈ្មោះ KHOEM-AI 🙂");
  });

  it("replies to thanks", () => {
    expect(khmerReply("អរគុណ")).toBe("មិនអីទេ! 🙂");
  });

  it("replies to AI identity questions", () => {
    expect(khmerReply("អ្នកជា AI ទេ")).toBe(
      "បាទ ប៉ុន្តែជា AI តូចមួយប៉ុណ្ណោះ។",
    );
  });

  it("replies to time questions", () => {
    const result = khmerReply("ម៉ោងប៉ុន្មាន");

    expect(result).toMatch(/^ឥឡូវនេះម៉ោង .+។$/);
  });

  it("replies to date questions", () => {
    const result = khmerReply("ថ្ងៃនេះថ្ងៃទីប៉ុន្មាន");

    expect(result).toMatch(/^ថ្ងៃនេះគឺ .+។$/);
  });

  it("uses learned exact answers", () => {
    const result = khmerReply(
      "តើ KHOEM-AI ជាអ្វី?",
      {
        "តើ khoem-ai ជាអ្វី?": "KHOEM-AI គឺជាជំនួយការ AI។",
      },
    );

    expect(result).toBe("KHOEM-AI គឺជាជំនួយការ AI។");
  });

  it("supports substring matching for Khmer phrasing", () => {
    const result = khmerReply("សួស្តីបង សូមជួយខ្ញុំ");

    expect(result).toBe("សួស្តី! 🙂 មានអ្វីអាចជួយបានទេ?");
  });

  it("returns null for unrelated Khmer input", () => {
    expect(khmerReply("ខ្ញុំចង់សួរអំពីភ្ជុំបិណ្ឌ")).toBeNull();
  });

  it("returns null for slash commands", () => {
    expect(khmerReply("/learn សួស្តី = សួស្តីបង!")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(khmerReply("   ")).toBeNull();
  });
});
