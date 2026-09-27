import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FILE = path.join(os.homedir(), "khoem-learned.json");
const BACKUP_DIR = path.join(os.homedir(), "khoem-learned-backups");

function withCleanLearnedFile(fn) {
  const hadFile = fs.existsSync(FILE);
  const original = hadFile ? fs.readFileSync(FILE, "utf8") : null;
  try {
    return fn();
  } finally {
    if (original !== null) fs.writeFileSync(FILE, original, "utf8");
    else fs.rmSync(FILE, { force: true });
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
}

describe("learn.mjs — matchLearned (confidence)", () => {
  it("exact match is HIGH confidence, score 1", async () => {
    await withCleanLearnedFile(async () => {
      const { handleLearn, matchLearned } = await import("../learn.mjs?t=" + Date.now());
      handleLearn("/learn តេស្តជាក់លាក់ = ចម្លើយត្រឹមត្រូវ");
      const r = matchLearned("តេស្តជាក់លាក់");
      expect(r.confidence).toBe("HIGH");
      expect(r.score).toBe(1);
      expect(r.answer).toBe("ចម្លើយត្រឹមត្រូវ");
    });
  });

  it("no learned entries at all is UNCERTAIN with a null answer", async () => {
    await withCleanLearnedFile(async () => {
      const { matchLearned } = await import("../learn.mjs?t=" + Date.now());
      const r = matchLearned("អ្វីមួយដែលមិនធ្លាប់បង្រៀនទាល់តែសោះ");
      expect(r.confidence).toBe("UNCERTAIN");
      expect(r.answer).toBe(null);
    });
  });

  it("confidence bucket is consistent with the score's own thresholds", async () => {
    await withCleanLearnedFile(async () => {
      const { handleLearn, matchLearned } = await import("../learn.mjs?t=" + Date.now());
      handleLearn("/learn តើអ្នកឈ្មោះអ្វី = ខ្ញុំឈ្មោះខួរ");
      const r = matchLearned("សួរខុសខ្លាំង មិនទាក់ទងគ្នាទាល់តែសោះ xyz 123");
      expect(r.score).toBeLessThan(1);
      if (r.score >= 0.7) expect(r.confidence).toBe("HIGH");
      else if (r.score >= 0.45) expect(r.confidence).toBe("MEDIUM");
      else expect(r.confidence).toBe("UNCERTAIN");
    });
  });
});
