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

  it("prefers learned answers over seed answers", () => {
    expect(khmerReply("អរគុណ", {
      "អរគុណ": "ចម្លើយដែលបានរៀន"
    })).toBe("ចម្លើយដែលបានរៀន");
  });

  it("normalizes learned keys with the same fold function", () => {
    const q = "\u1794\u178e\u17d2\u178a\u17b9\u1784 zzz";
    expect(khmerReply(q, { [q]: "X" })).toBe("X");
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
    expect(khmerReply("ខ្ញុំចង់សួរអំពីភពសែនស៊ូនៅឆ្ងាយបំផុត")).toBeNull();
  });

  it("returns null for slash commands", () => {
    expect(khmerReply("/learn សួស្តី = សួស្តីបង!")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(khmerReply("   ")).toBeNull();
  });

  it("replies about weekdays", () => {
    expect(khmerReply("ថ្ងៃច័ន្ទ")).toBe(
      "ថ្ងៃច័ន្ទជាថ្ងៃដំបូងនៃសប្តាហ៍ធ្វើការ។",
    );
  });

  it("replies with Khmer numbers", () => {
    expect(khmerReply("រាប់លេខ១ដល់១០")).toBe(
      "១ ២ ៣ ៤ ៥ ៦ ៧ ៨ ៩ ១០",
    );
  });

  it("replies to simple arithmetic in Khmer", () => {
    expect(khmerReply("មួយបូកមួយប៉ុន្មាន")).toBe(
      "មួយបូកមួយស្មើនឹងពីរ។",
    );
  });

  it("handles weather limitation honestly", () => {
    const result = khmerReply("ធាតុអាកាសថ្ងៃនេះ");
    expect(result).toContain("ខ្ញុំមិនអាចមើលធាតុអាកាសខាងក្រៅបានទេ");
  });

  it("replies to food small talk", () => {
    expect(khmerReply("ញ៉ាំបាយហើយឬនៅ")).toContain(
      "ខ្ញុំគ្មានរាងកាយទេ",
    );
  });

  it("replies to code-help questions", () => {
    expect(khmerReply("អាចជួយកែកូដទេ")).toContain("/patch");
  });


  it("answers drought questions with drought-related guidance", () => {
    const result = khmerReply("តើពេលអត់ភ្លៀងខ្ញុំគួរធ្វើដូចម្តេច?");
    expect(result).not.toBeNull();
    expect(result).toContain("ទឹក");
    expect(result).not.toContain("ឆ័ត្រ");
  });

  it("answers questions about traditional Khmer sports", () => {
    const result = khmerReply("ខ្ញុំចង់ស្គាល់កីឡាបុរាណរបស់ខ្មែរ");
    expect(result).not.toBeNull();
    expect(result).toMatch(/គុនខ្មែរ|ល្បុក្កតោ/);
  });

  it("answers questions about traditional Khmer musical ensembles", () => {
    const result = khmerReply(
      "តើវង់ភ្លេងដែលគេលេងក្នុងពិធីបុរាណមានឧបករណ៍អ្វីខ្លះ?"
    );
    expect(result).not.toBeNull();
    expect(result).toContain("ពិណពាទ្យ");
  });
});
